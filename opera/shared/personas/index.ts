import { stoic } from "./stoic";
import { vc } from "./vc";
import { hedonist } from "./hedonist";

export interface Persona {
    id: string;
    name: string;
    description: string;
    avatar_color: string;
    systemPrompt: string;
}

export const PERSONAS: Persona[] = [stoic, vc, hedonist];
export const PERSONA_MAP: Record<string, Persona> = {
    [stoic.id]: stoic,
    [vc.id]: vc,
    [hedonist.id]: hedonist
};

export const getFriendlyName = (backendName: string) => {
    if (!backendName) return "AI";
    const lower = backendName.toLowerCase();
    if (lower.includes("pragmatic") || lower.includes("stoic")) return "Luna";
    if (
      lower.includes("venture") ||
      lower.includes("capitalist") ||
      lower.includes("vc")
    )
      return "Sage";
    if (lower.includes("creative") || lower.includes("hedonist")) return "Baz";
    return backendName;
};
