import type { Metadata } from "next";
import { LegendChat } from "@/components/LegendChat";

export const metadata: Metadata = {
  title: "Legend Chat — what to eat near you · Skinny Legend",
  description: "Ask the Legend what to eat nearby. Restaurants from Yelp, picks that fit your macros.",
};

export default function ChatPage() {
  return <LegendChat />;
}
