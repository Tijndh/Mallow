from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionResponse,
    CheckoutStatusResponse,
    CheckoutSessionRequest,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===================
# MODELS
# ===================

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    subtitle: str
    description: str
    ingredients: List[str]
    benefits: List[str]
    usage: str
    price: float
    image_url: str
    category: str
    in_stock: bool = True

class CartItem(BaseModel):
    product_id: str
    quantity: int

class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    items: List[CartItem] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    subject: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactMessageCreate(BaseModel):
    name: str
    email: str
    subject: str
    message: str

class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    amount: float
    currency: str
    status: str
    payment_status: str
    metadata: Dict = {}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CheckoutRequest(BaseModel):
    cart_id: str
    origin_url: str

# ===================
# PRODUCTS DATA
# ===================

PRODUCTS: List[Product] = [
    Product(
        id="puur-twellow-balsem",
        name="Puur Twellow Balsem",
        subtitle="Puur voedend gezichts- en handcrème",
        description="Een rijke, voedende balsem die diep hydrateert en de huid verzacht. Gemaakt met zorgvuldig geselecteerde natuurlijke ingrediënten uit de Betuwe. Perfect voor de droge, gevoelige huid die extra verzorging nodig heeft.",
        ingredients=["Bijenwas", "Olijfolie", "Lavendelolie", "Vitamine E", "Sheaboter"],
        benefits=["Diepe hydratatie", "Verzacht droge huid", "Kalmeert geïrriteerde huid", "Beschermt tegen weersinvloeden"],
        usage="Breng een kleine hoeveelheid aan op het gezicht en de handen. Masseer zachtjes in tot volledig opgenomen. Gebruik dagelijks voor optimale resultaten.",
        price=24.95,
        image_url="https://customer-assets.emergentagent.com/job_17aea5b5-60fd-49c6-a8ac-e25439437904/artifacts/c97c3sfn_image.png",
        category="gezichtsverzorging"
    ),
    Product(
        id="honingbalsem",
        name="Honingbalsem",
        subtitle="Helend en zuiverend voor gevoelige en ontstoken huid",
        description="Een helende balsem verrijkt met pure Nederlandse honing. Speciaal ontwikkeld voor de gevoelige en ontstoken huid. De natuurlijke antiseptische eigenschappen van honing werken kalmerend en herstellend.",
        ingredients=["Nederlandse honing", "Bijenwas", "Zonnebloempitolie", "Propolis", "Calendula-extract"],
        benefits=["Helend en herstellend", "Antiseptische werking", "Kalmeert ontstekingen", "Voedt de huid intensief"],
        usage="Breng aan op schone huid, met name op geïrriteerde of ontstoken plekken. Kan meerdere keren per dag gebruikt worden. Ook geschikt als nachtcrème.",
        price=27.95,
        image_url="https://customer-assets.emergentagent.com/job_17aea5b5-60fd-49c6-a8ac-e25439437904/artifacts/kp498wxu_image.png",
        category="gezichtsverzorging"
    ),
    Product(
        id="castorbalsem",
        name="Castorbalsem",
        subtitle="Voedend en zuiverend gezichts- en lichaamscrème",
        description="Een krachtige balsem met castorolie, bekend om zijn diepreinigende en voedende eigenschappen. Ideaal voor zowel gezicht als lichaam. Stimuleert de natuurlijke regeneratie van de huid.",
        ingredients=["Castorolie", "Kokosolie", "Bijenwas", "Jojobaolie", "Rozemarijnolie"],
        benefits=["Diepe reiniging", "Stimuleert huidregeneratie", "Verzacht en voedt", "Geschikt voor gezicht én lichaam"],
        usage="Masseer een kleine hoeveelheid in op de huid. Voor diepte-reiniging: breng een dikkere laag aan, laat 10 minuten intrekken en verwijder met een warm, vochtig doekje.",
        price=22.95,
        image_url="https://customer-assets.emergentagent.com/job_17aea5b5-60fd-49c6-a8ac-e25439437904/artifacts/falyyyco_image.png",
        category="gezichtsverzorging"
    )
]

PRODUCTS_DICT = {p.id: p for p in PRODUCTS}

# ===================
# PRODUCT ENDPOINTS
# ===================

@api_router.get("/products", response_model=List[Product])
async def get_products():
    return PRODUCTS

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    if product_id not in PRODUCTS_DICT:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    return PRODUCTS_DICT[product_id]

# ===================
# CART ENDPOINTS
# ===================

@api_router.post("/cart", response_model=Cart)
async def create_cart():
    cart = Cart()
    doc = cart.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.carts.insert_one(doc)
    return cart

@api_router.get("/cart/{cart_id}")
async def get_cart(cart_id: str):
    cart = await db.carts.find_one({"id": cart_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Winkelwagen niet gevonden")
    
    # Calculate totals
    items_with_details = []
    total = 0.0
    for item in cart.get("items", []):
        if item["product_id"] in PRODUCTS_DICT:
            product = PRODUCTS_DICT[item["product_id"]]
            item_total = product.price * item["quantity"]
            total += item_total
            items_with_details.append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "product": product.model_dump(),
                "item_total": item_total
            })
    
    return {
        "id": cart["id"],
        "items": items_with_details,
        "total": round(total, 2),
        "item_count": sum(item["quantity"] for item in cart.get("items", []))
    }

@api_router.post("/cart/{cart_id}/items")
async def add_to_cart(cart_id: str, item: CartItem):
    cart = await db.carts.find_one({"id": cart_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Winkelwagen niet gevonden")
    
    if item.product_id not in PRODUCTS_DICT:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    
    items = cart.get("items", [])
    existing_item = next((i for i in items if i["product_id"] == item.product_id), None)
    
    if existing_item:
        existing_item["quantity"] += item.quantity
    else:
        items.append({"product_id": item.product_id, "quantity": item.quantity})
    
    await db.carts.update_one(
        {"id": cart_id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return await get_cart(cart_id)

@api_router.put("/cart/{cart_id}/items/{product_id}")
async def update_cart_item(cart_id: str, product_id: str, quantity: int):
    cart = await db.carts.find_one({"id": cart_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Winkelwagen niet gevonden")
    
    items = cart.get("items", [])
    
    if quantity <= 0:
        items = [i for i in items if i["product_id"] != product_id]
    else:
        existing_item = next((i for i in items if i["product_id"] == product_id), None)
        if existing_item:
            existing_item["quantity"] = quantity
    
    await db.carts.update_one(
        {"id": cart_id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return await get_cart(cart_id)

@api_router.delete("/cart/{cart_id}/items/{product_id}")
async def remove_from_cart(cart_id: str, product_id: str):
    cart = await db.carts.find_one({"id": cart_id}, {"_id": 0})
    if not cart:
        raise HTTPException(status_code=404, detail="Winkelwagen niet gevonden")
    
    items = [i for i in cart.get("items", []) if i["product_id"] != product_id]
    
    await db.carts.update_one(
        {"id": cart_id},
        {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return await get_cart(cart_id)

# ===================
# CHECKOUT ENDPOINTS
# ===================

@api_router.post("/checkout")
async def create_checkout(checkout_req: CheckoutRequest, request: Request):
    cart = await db.carts.find_one({"id": checkout_req.cart_id}, {"_id": 0})
    if not cart or not cart.get("items"):
        raise HTTPException(status_code=400, detail="Winkelwagen is leeg")
    
    # Calculate total from server-side product prices
    total = 0.0
    for item in cart.get("items", []):
        if item["product_id"] in PRODUCTS_DICT:
            product = PRODUCTS_DICT[item["product_id"]]
            total += product.price * item["quantity"]
    
    if total <= 0:
        raise HTTPException(status_code=400, detail="Ongeldige winkelwagen")
    
    # Build URLs from provided origin
    success_url = f"{checkout_req.origin_url}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{checkout_req.origin_url}/cart"
    
    # Initialize Stripe
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session
    checkout_request = CheckoutSessionRequest(
        amount=float(total),
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={"cart_id": checkout_req.cart_id}
    )
    
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = PaymentTransaction(
        session_id=session.session_id,
        amount=total,
        currency="eur",
        status="pending",
        payment_status="pending",
        metadata={"cart_id": checkout_req.cart_id}
    )
    
    doc = transaction.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.payment_transactions.insert_one(doc)
    
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(session_id: str, request: Request):
    # Initialize Stripe
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Get status from Stripe
    status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Update transaction in database
    await db.payment_transactions.update_one(
        {"session_id": session_id},
        {"$set": {
            "status": status.status,
            "payment_status": status.payment_status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # If payment successful, clear the cart
    if status.payment_status == "paid":
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if transaction and transaction.get("metadata", {}).get("cart_id"):
            cart_id = transaction["metadata"]["cart_id"]
            await db.carts.update_one(
                {"id": cart_id},
                {"$set": {"items": [], "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction
        await db.payment_transactions.update_one(
            {"session_id": webhook_response.session_id},
            {"$set": {
                "status": webhook_response.event_type,
                "payment_status": webhook_response.payment_status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

# ===================
# CONTACT ENDPOINTS
# ===================

@api_router.post("/contact", response_model=ContactMessage)
async def create_contact_message(message: ContactMessageCreate):
    contact = ContactMessage(**message.model_dump())
    doc = contact.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.contact_messages.insert_one(doc)
    logger.info(f"New contact message from {contact.email}: {contact.subject}")
    return contact

# ===================
# ROOT ENDPOINT
# ===================

@api_router.get("/")
async def root():
    return {"message": "Mallow API"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
