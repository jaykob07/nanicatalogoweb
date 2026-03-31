import { useState } from "react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { Edit, Trash2, MessageCircle } from "lucide-react";

const getWhatsAppUrl = (name: string, reference: string): string => {
  const message = encodeURIComponent(`Hola, estoy interesado en: ${name} (Ref: ${reference})`);
  return `https://wa.me/573206893616?text=${message}`;
};

interface ProductCardProps {
  id: string;
  name: string;
  reference: string;
  description: string;
  price: number;
  imageUrl?: string;
  isAdmin?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const ProductCard = ({
  id,
  name,
  reference,
  description,
  price,
  imageUrl,
  isAdmin = false,
  onEdit,
  onDelete,
}: ProductCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const whatsappUrl = getWhatsAppUrl(name, reference);

  const handleImageClick = () => {
    if (imageUrl) {
      setIsImageExpanded(true);
    }
  };

  return (
    <>
      <Card className="w-full min-w-0 group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 bg-card border-border flex flex-col">
        <div 
          className={`relative aspect-square overflow-hidden bg-muted ${imageUrl ? 'cursor-pointer' : ''}`}
          onClick={handleImageClick}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
          <div className="absolute top-2 right-2 bg-primary/90 backdrop-blur-sm text-primary-foreground px-3 py-1 rounded-full text-sm font-semibold pointer-events-none">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price)}
          </div>
        </div>
        
        <CardContent className="p-4 flex-grow">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground line-clamp-1">{name}</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-primary">Ref:</span> {reference}
            </p>
            <p
              className={`font-semibold text-yellow-400 text-balance text-card-foreground cursor-pointer transition-all duration-200 ${isExpanded ? "line-clamp-none" : "line-clamp-2"}`}
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? "Ver menos" : "Ver más"}
            >
              {description}
            </p>
          </div>
        </CardContent>

        <CardFooter className="p-4 pt-0 mt-auto flex gap-2">
          {isAdmin ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEdit?.(id)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                onClick={() => onDelete?.(id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </Button>
            </>
          ) : (
            <Button
              className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-medium"
              onClick={() => window.open(whatsappUrl, '_blank')}
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Consultar
            </Button>
          )}
        </CardFooter>
      </Card>

      {isImageExpanded && imageUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageExpanded(false)}
        >
          <div className="relative max-w-full max-h-full flex items-center justify-center">
            <button 
              className="absolute -top-10 right-0 text-white hover:text-gray-300 font-bold p-2 text-xl"
              onClick={() => setIsImageExpanded(false)}
            >
               × 
            </button>
            <img 
              src={imageUrl} 
              alt={name} 
              className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
              onClick={(e) => e.stopPropagation()} 
            />
          </div>
        </div>
      )}
    </>
  );
};
