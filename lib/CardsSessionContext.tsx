/**
 * CardsSessionContext: Drží dočasný session stav pridaných kariet pre obrazovky kariet.
 *
 * Prečo: Zdieľaný kontext udrží konzistentný stav kariet aj pri prechode medzi viacerými krokmi flowu.
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export interface SessionCard {
  id: string;
  cardName: string;
  cardNumber: string;
  createdAt: number;
}

interface CardsSessionContextType {
  cards: SessionCard[];
  addCard: (card: { cardName: string; cardNumber: string }) => void;
  removeCard: (cardNumber: string) => void;
  clearCards: () => void;
}

const CardsSessionContext = createContext<CardsSessionContextType | null>(null);

const normalizeCardNumber = (value: string): string => value.replace(/\s/g, "");

export const CardsSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [cards, setCards] = useState<SessionCard[]>([]);

  const addCard = useCallback((card: { cardName: string; cardNumber: string }) => {
    const cardName = card.cardName.trim();
    const cardNumber = card.cardNumber.trim();
    if (!cardName || !cardNumber) {
      return;
    }

    const normalizedCardNumber = normalizeCardNumber(cardNumber);
    setCards((prevCards) => {
      const existingIndex = prevCards.findIndex(
        (item) => normalizeCardNumber(item.cardNumber) === normalizedCardNumber
      );

      if (existingIndex >= 0) {
        const updatedCards = [...prevCards];
        updatedCards[existingIndex] = {
          ...updatedCards[existingIndex],
          cardName,
          cardNumber,
          createdAt: Date.now(),
        };
        return updatedCards;
      }

      const nextCard: SessionCard = {
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        cardName,
        cardNumber,
        createdAt: Date.now(),
      };
      return [nextCard, ...prevCards];
    });
  }, []);

  const removeCard = useCallback((cardNumber: string) => {
    const normalizedCardNumber = normalizeCardNumber(cardNumber.trim());
    if (!normalizedCardNumber) {
      return;
    }

    setCards((prevCards) =>
      prevCards.filter(
        (item) => normalizeCardNumber(item.cardNumber) !== normalizedCardNumber
      )
    );
  }, []);

  const clearCards = useCallback(() => {
    setCards([]);
  }, []);

  const value = useMemo(
    () => ({ cards, addCard, removeCard, clearCards }),
    [cards, addCard, removeCard, clearCards]
  );

  return (
    <CardsSessionContext.Provider value={value}>
      {children}
    </CardsSessionContext.Provider>
  );
};

export const useCardsSession = () => {
  const context = useContext(CardsSessionContext);
  if (!context) {
    throw new Error("useCardsSession must be used within a CardsSessionProvider");
  }
  return context;
};
