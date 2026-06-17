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
    if (backendName === "The Pragmatic Stoic") return "Luna";
    if (backendName === "The Venture Capitalist") return "Sage";
    if (backendName === "The Creative Hedonist") return "Baz";
    return backendName;
};
