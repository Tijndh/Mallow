import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProductCard({ product, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="group"
    >
      <Link 
        to={`/product/${product.id}`}
        data-testid={`product-card-${product.id}`}
        className="block"
      >
        {/* Image Container */}
        <div className="aspect-square bg-card border border-border overflow-hidden mb-8 relative">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-500"></div>
          {/* Quick View Label */}
          <div className="absolute bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
            <p className="text-xs uppercase tracking-[0.2em] text-center">Bekijk product</p>
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-3">
          <h3 className="font-serif text-xl text-foreground group-hover:opacity-70 transition-opacity duration-300">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {product.subtitle}
          </p>
          <p className="text-sm font-medium text-foreground pt-2">
            €{product.price.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
