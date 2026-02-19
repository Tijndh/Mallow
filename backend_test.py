import requests
import sys
import json
from datetime import datetime

class MallowAPITester:
    def __init__(self, base_url="https://pure-mallow.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.cart_id = None

    def log(self, message):
        print(f"[{datetime.now().strftime('%H:%M:%S')}] {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ {name} - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                self.log(f"❌ {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    self.log(f"Response: {response.json()}")
                except:
                    self.log(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            self.log(f"❌ {name} - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_get_products(self):
        """Test getting all products"""
        success, response = self.run_test("Get All Products", "GET", "products", 200)
        if success and isinstance(response, list):
            self.log(f"✅ Found {len(response)} products")
            # Verify product structure
            for product in response:
                required_fields = ['id', 'name', 'price', 'description', 'image_url']
                if all(field in product for field in required_fields):
                    self.log(f"✅ Product {product['id']} has all required fields")
                else:
                    self.log(f"❌ Product {product['id']} missing required fields")
        return success, response

    def test_get_single_product(self, product_id):
        """Test getting a single product"""
        return self.run_test(f"Get Product {product_id}", "GET", f"products/{product_id}", 200)

    def test_create_cart(self):
        """Test creating a new cart"""
        success, response = self.run_test("Create Cart", "POST", "cart", 200)
        if success and 'id' in response:
            self.cart_id = response['id']
            self.log(f"✅ Cart created with ID: {self.cart_id}")
        return success, response

    def test_get_cart(self):
        """Test getting cart details"""
        if not self.cart_id:
            self.log("❌ No cart ID available")
            return False, {}
        return self.run_test("Get Cart", "GET", f"cart/{self.cart_id}", 200)

    def test_add_to_cart(self, product_id, quantity=1):
        """Test adding product to cart"""
        if not self.cart_id:
            self.log("❌ No cart ID available")
            return False, {}
        
        data = {
            "product_id": product_id,
            "quantity": quantity
        }
        return self.run_test(f"Add {product_id} to Cart", "POST", f"cart/{self.cart_id}/items", 200, data)

    def test_update_cart_quantity(self, product_id, quantity):
        """Test updating cart item quantity"""
        if not self.cart_id:
            self.log("❌ No cart ID available")
            return False, {}
        
        return self.run_test(f"Update Cart Quantity", "PUT", f"cart/{self.cart_id}/items/{product_id}?quantity={quantity}", 200)

    def test_remove_from_cart(self, product_id):
        """Test removing item from cart"""
        if not self.cart_id:
            self.log("❌ No cart ID available")
            return False, {}
            
        return self.run_test(f"Remove {product_id} from Cart", "DELETE", f"cart/{self.cart_id}/items/{product_id}", 200)

    def test_checkout(self):
        """Test checkout creation"""
        if not self.cart_id:
            self.log("❌ No cart ID available")
            return False, {}
            
        data = {
            "cart_id": self.cart_id,
            "origin_url": "https://pure-mallow.preview.emergentagent.com"
        }
        return self.run_test("Create Checkout", "POST", "checkout", 200, data)

    def test_contact_form(self):
        """Test contact form submission"""
        data = {
            "name": "Test User",
            "email": "test@example.com", 
            "subject": "Test bericht",
            "message": "Dit is een test bericht voor de contactform."
        }
        return self.run_test("Contact Form", "POST", "contact", 200, data)

    def run_all_tests(self):
        """Run comprehensive API tests"""
        self.log("🚀 Starting Mallow API Testing...")
        
        # Test API root
        self.test_root_endpoint()
        
        # Test products
        success, products = self.test_get_products()
        product_ids = []
        if success and isinstance(products, list):
            product_ids = [p['id'] for p in products[:2]]  # Test first 2 products
            
            for product_id in product_ids:
                self.test_get_single_product(product_id)
        
        # Test cart operations
        if self.test_create_cart()[0]:
            self.test_get_cart()
            
            # Test adding products to cart
            if product_ids:
                self.test_add_to_cart(product_ids[0], 2)
                self.test_add_to_cart(product_ids[1], 1)
                
                # Test cart after adding items
                success, cart_data = self.test_get_cart()
                if success and cart_data.get('items'):
                    self.log(f"✅ Cart has {len(cart_data['items'])} items, total: €{cart_data.get('total', 0)}")
                    
                    # Test quantity update
                    self.test_update_cart_quantity(product_ids[0], 3)
                    
                    # Test checkout (this should create Stripe session)
                    checkout_success, checkout_data = self.test_checkout()
                    if checkout_success and 'url' in checkout_data:
                        self.log(f"✅ Checkout URL created: {checkout_data['url'][:50]}...")
                    
                    # Test removing item
                    self.test_remove_from_cart(product_ids[0])
        
        # Test contact form
        self.test_contact_form()
        
        # Print final results
        self.log(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        self.log(f"📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = MallowAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())