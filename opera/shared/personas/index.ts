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

const FRIENDLY_NAME_MAP: Record<string, string> = {
    "pragmatic stoic": "Luna",
    "stoic": "Luna",
    "venture capitalist": "Sage",
    "capitalist": "Sage",
    "vc": "Sage",
    "creative hedonist": "Baz",
    "hedonist": "Baz"
};

export const getFriendlyName = (backendName: string): string => {
    if (!backendName) return "AI";
    
    const lowerName = backendName.toLowerCase();
    
    // Check if the exact lower-cased name exists in our map
    if (FRIENDLY_NAME_MAP[lowerName]) {
        return FRIENDLY_NAME_MAP[lowerName];
    }

    // Check if any key in map is contained within the name
    for (const key in FRIENDLY_NAME_MAP) {
        if (lowerName.includes(key)) {
            return FRIENDLY_NAME_MAP[key];
        }
    }
    
    return backendName;
};
