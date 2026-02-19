import { motion } from 'framer-motion';
import { Leaf, Heart, Sparkles } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen pt-20" data-testid="about-page">
      {/* Hero */}
      <section className="px-6 lg:px-12 py-16 lg:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                Over Ons
              </p>
              <h1 className="font-serif text-4xl lg:text-5xl mb-6">
                De kracht van<br />
                <span className="italic">pure natuur</span>
              </h1>
              <p className="text-muted-foreground leading-relaxed">
                Mallow is geboren uit een diepe overtuiging dat onze huid 
                verdient wat de natuur te bieden heeft — niet meer, niet minder.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="aspect-[4/3] bg-card border border-border overflow-hidden"
            >
              <img
                src="https://images.pexels.com/photos/30754235/pexels-photo-30754235.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Natuurlijke ingrediënten"
                className="w-full h-full object-cover"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <h2 className="font-serif text-3xl lg:text-4xl">Ons Verhaal</h2>
            <div className="space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Het begon allemaal met een simpele vraag: waarom zitten er zoveel 
                onbekende ingrediënten in onze dagelijkse huidverzorging? Na jaren 
                van onderzoek en experimenteren in onze kleine keuken, besloten we 
                het anders te doen.
              </p>
              <p>
                In ons atelier in het hart van de Betuwe maken we elke pot balsem 
                met de hand. We gebruiken alleen ingrediënten waarvan we de 
                herkomst kennen en waarvan we overtuigd zijn dat ze goed zijn 
                voor jouw huid én voor onze planeet.
              </p>
              <p>
                Geen lange lijsten met onuitspreekbare stoffen. Geen 
                massaproductie. Gewoon pure, eerlijke producten die doen 
                wat ze beloven: je huid voeden, verzorgen en beschermen.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 lg:px-12 py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
              Onze Waarden
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl">
              Waar wij voor staan
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-card border border-border p-8"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-4">Duurzaamheid</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We kiezen bewust voor duurzame verpakkingen en lokale ingrediënten. 
                Onze glazen potten zijn herbruikbaar en al onze labels zijn gemaakt 
                van gerecycled papier.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-card border border-border p-8"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-4">Transparantie</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We geloven in volledige openheid over onze ingrediënten en processen. 
                Elk ingrediënt dat we gebruiken kun je terugvinden in de natuur en 
                is zorgvuldig geselecteerd.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-card border border-border p-8"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-serif text-xl mb-4">Kwaliteit</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Kleine batches betekent meer aandacht voor detail. Elke pot wordt 
                met zorg gecontroleerd voordat deze ons atelier verlaat. 
                Kwaliteit boven kwantiteit, altijd.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Ingredients */}
      <section className="px-6 lg:px-12 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="aspect-square bg-card border border-border overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1769258263607-d997358546a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzl8MHwxfHNlYXJjaHwxfHxob25leWNvbWIlMjB0ZXh0dXJlJTIwbWFjcm8lMjBhbWJlciUyMGxpZ2h0fGVufDB8fHx8MTc3MTUxNzcxNXww&ixlib=rb-4.1.0&q=85"
                  alt="Honing"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square bg-card border border-border overflow-hidden mt-8">
                <img
                  src="https://images.unsplash.com/photo-1749803848970-0824922db673?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTN8MHwxfHNlYXJjaHwzfHxsYXZlbmRlciUyMGZsb3dlcnMlMjBzb2Z0JTIwZm9jdXN8ZW58MHx8fHwxNzcxNTE3NzE4fDA&ixlib=rb-4.1.0&q=85"
                  alt="Lavendel"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square bg-card border border-border overflow-hidden">
                <img
                  src="https://images.pexels.com/photos/29302245/pexels-photo-29302245.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="Sinaasappel"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="aspect-square bg-card border border-border overflow-hidden mt-8">
                <img
                  src="https://images.pexels.com/photos/30754235/pexels-photo-30754235.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                  alt="Sheaboter"
                  className="w-full h-full object-cover"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <p className="text-sm uppercase tracking-widest text-muted-foreground mb-4">
                Onze Ingrediënten
              </p>
              <h2 className="font-serif text-3xl lg:text-4xl mb-6">
                Zorgvuldig geselecteerd
              </h2>
              <div className="space-y-6 text-muted-foreground leading-relaxed">
                <p>
                  Elk ingrediënt in onze producten is met zorg gekozen. 
                  Van Nederlandse bijenwas tot biologische oliën — we weten 
                  precies waar alles vandaan komt.
                </p>
                <p>
                  We werken samen met lokale imkers en leveranciers die 
                  dezelfde waarden delen. Zo weten we zeker dat onze 
                  ingrediënten niet alleen goed zijn voor jouw huid, 
                  maar ook voor de wereld om ons heen.
                </p>
              </div>
              <ul className="mt-8 space-y-3 text-sm">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Biologische bijenwas uit de Betuwe
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Koudgeperste oliën
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Etherische oliën van hoge kwaliteit
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-3"></span>
                  Geen synthetische toevoegingen
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
