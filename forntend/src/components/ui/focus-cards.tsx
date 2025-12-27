"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Card = React.memo(
  ({
    card,
    index,
    hovered,
    setHovered,
    onGetStarted,
  }: {
    card: any;
    index: number;
    hovered: number | null;
    setHovered: React.Dispatch<React.SetStateAction<number | null>>;
    onGetStarted: (id: string) => void;
  }) => (
    <div
      onMouseEnter={() => setHovered(index)}
      onMouseLeave={() => setHovered(null)}
      className={cn(
        "rounded-lg relative bg-gray-100 dark:bg-neutral-900 overflow-hidden h-60 md:h-96 w-full transition-all duration-300 ease-out cursor-pointer group",
        hovered !== null && hovered !== index && "blur-sm scale-[0.98]"
      )}
    >
      <img
        src={card.src}
        alt={card.title}
        className="object-cover absolute inset-0 group-hover:scale-110 transition-transform duration-300"
      />

      {/* Title - Always Visible */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-16 pb-6 px-6">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {card.title}
        </div>
        <p className="text-sm text-gray-200 mt-2">{card.description}</p>
      </div>

      {/* Hover Overlay with Button */}
      <div
        className={cn(
          "absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 transition-opacity duration-300",
          hovered === index ? "opacity-100" : "opacity-0"
        )}
      >
        <Button
          onClick={() => onGetStarted(card.id)}
          variant="outline"
          className="gap-2 font-semibold"
          size="lg"
        >
          Let's Get Started <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
);

Card.displayName = "Card";

type CardType = {
  title: string;
  description: string;
  src: string;
  id: string;
};

export function FocusCards({ 
  cards, 
  onCardClick 
}: { 
  cards: CardType[]; 
  onCardClick: (id: string) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto md:px-8 w-full">
      {cards.map((card, index) => (
        <Card
          key={card.id}
          card={card}
          index={index}
          hovered={hovered}
          setHovered={setHovered}
          onGetStarted={onCardClick}
        />
      ))}
    </div>
  );
}
