import { IReaction } from "../common";

/**
 - Get reactions summary:
    - Get total number of reactions 🔢
    - Get types of reactions ®️
 -------------------------------
 * @param {Array} reactions - Array of reactions
 * @returns {Object} - Object with total number of reactions and types of reactions
*/
export const getReactionsSummary = (reactions: IReaction[] = []) => {
    if (!Array.isArray(reactions) || reactions.length === 0){
        return { total: 0, types: [] };
    }

    const types = Array.from(new Set(reactions.map((r) => r.reaction)));

    return { 
        total: reactions.length, 
        types 
    };
};
