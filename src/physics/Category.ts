import { _Map, _undefined } from "../common/references";

export type CategoryTag = string | symbol;

export interface CategoryObject {
    readonly MAX_COUNT: number;
    readonly FULL_FILTER: number;
    registry: [CategoryTag, number][];
    count: number;
    next(): number;
    for(tag: CategoryTag): number;
    tagFor(filter: number): CategoryTag | void;
}

export const Category: CategoryObject = {

    MAX_COUNT: 32,
    FULL_FILTER: 0xFFFF_FFFF,
    registry: [],
    count: 0,

    next() {
        if (Category.count > Category.MAX_COUNT) {
            throw "Max filter count exceeded";
        }
        return 1 << Category.count++;
    },

    for(tag) {
        let result!: number;
        Category.registry.find(record => {
            if (record[0] === tag) {
                result = record[1];
                return true;
            } else {
                return false;
            }
        });
        if (!result) {
            result = Category.next();
            Category.registry.push([tag, result]);
        }
        return result;
    },

    tagFor(filter) {
        let result: CategoryTag | undefined;
        Category.registry.find(record => {
            if (record[1] === filter) {
                result = record[0];
                return true;
            } else {
                return false;
            }
        });
        return result;
    }

};
