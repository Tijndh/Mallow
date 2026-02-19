import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProductCard({ product, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <Link 
        to={`/product/${product.id}`}
        data-testid={`product-card-${product.id}`}
        className="block"
      >
        {/* Image Container */}
        <div className="aspect-square bg-card border border-border overflow-hidden mb-6">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover product-image"
          />
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-serif text-xl text-foreground group-hover:opacity-70 transition-opacity">
            {product.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.subtitle}
          </p>
          <p className="text-sm font-medium text-foreground mt-4">
            €{product.price.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
