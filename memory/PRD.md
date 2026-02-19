# Mallow - Natuurlijke Huidverzorging Website

## Originele Probleemstelling
Bouw een volledig werkende website voor natuurlijke gezichtscrème voor het merk "Mallow" in het Nederlands. Geïnspireerd door luxe huidverzorgingsmerken zoals Aesop, Italic, Minimaliste.green.

## Architectuur
- **Frontend**: React 19 met Tailwind CSS, Framer Motion voor animaties, Sonner voor toasts
- **Backend**: FastAPI met MongoDB
- **Betalingen**: Stripe Checkout integratie
- **Design**: Minimalistisch, aardse tinten, Playfair Display + Mulish fonts

## User Personas
1. **Primair**: Nederlandse vrouwen 25-55, gezondheidsbewust, eco-vriendelijk
2. **Secundair**: Mensen op zoek naar natuurlijke/biologische huidverzorging

## Core Requirements (Static)
- [x] Homepage met hero sectie en productweergave
- [x] Shop pagina met alle producten
- [x] Product detail pagina's
- [x] Winkelwagen functionaliteit
- [x] Stripe checkout integratie
- [x] Over ons pagina
- [x] Contact formulier
- [x] Nederlandse taal

## Wat is Geïmplementeerd (Jan 2026)
- Homepage met bento grid layout, hero sectie, productcards
- Shop pagina met 3 producten: Puur Twellow Balsem, Honingbalsem, Castorbalsem
- Product detail pagina's met ingrediënten, voordelen, gebruiksaanwijzing
- Winkelwagen met add/remove/update quantity
- Stripe checkout flow met success/cancel pages
- Contact formulier met MongoDB opslag
- Over ons pagina met merkwaarden
- Responsive design voor mobile/desktop
- Animaties met Framer Motion
- Organic grain texture overlay

## Backlog (Prioritized)
### P0 - Kritiek
- Geen openstaande P0 items

### P1 - Hoog
- Email notificaties voor contactformulier (SendGrid/Resend integratie)
- Orderbevestiging emails naar klanten
- Admin dashboard voor orders

### P2 - Medium
- Klantaccounts/login systeem
- Wishlist functionaliteit
- Productreviews
- Nieuwsbrief aanmelding
- FAQ pagina

## Volgende Taken
1. Email integratie voor contactformulier
2. Order management systeem
3. SEO optimalisatie (meta tags, sitemap)
