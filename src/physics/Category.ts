import { _Map, _undefined } from "../common/references";

export type CategoryTag = string | symbol;
export type CategoryRecord = [CategoryTag, number];

export interface CategoryObject {
    readonly MAX_COUNT: number;
    readonly FULL_MASK: number;
    registry: CategoryRecord[];
    count: number;
    readonly next: () => number;
    readonly for: (tag: CategoryTag) => number;
    readonly tagFor: (category: number) => CategoryTag | void;
}

export const Category: CategoryObject = {

    MAX_COUNT: 32,
    FULL_MASK: 0xFFFF_FFFF,
    registry: [],
    count: 0,

    next() {
        if (Category.count > Category.MAX_COUNT) {
            throw "Max category count exceeded";
        }
        return 1 << Category.count++;
    },

    for(tag) {
        const record = Category.registry.find(record => record[0] === tag);
        if (!record) {
            const category = Category.next();
            Category.registry.push([tag, category]);
            return category;
        } else {
            return record[1];
        }
    },

    tagFor(category) {
        const result = Category.registry.find(record => record[1] === category);
        return result && result[0];
    }

};
