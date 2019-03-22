import { _Map, _undefined } from "../utils/references";

export type FilterTag = string | symbol;

export interface FilterObject {
    readonly MAX_COUNT: number;
    readonly FULL_MASK: number;
    registry: [FilterTag, number][];
    count: number;
    next(): number;
    for(tag: FilterTag): number;
    tagFor(filter: number): FilterTag | void;
}

export const Filter: FilterObject = {

    MAX_COUNT: 32,
    FULL_MASK: 0xFFFF_FFFF,
    registry: [],
    count: 0,

    next() {
        if (Filter.count > Filter.MAX_COUNT) {
            throw "Max filter count exceeded";
        }
        return 1 << Filter.count++;
    },

    for(tag) {
        let result!: number;
        Filter.registry.find(record => {
            if (record[0] === tag) {
                result = record[1];
                return true;
            } else {
                return false;
            }
        });
        if (!result) {
            result = Filter.next();
            Filter.registry.push([tag, result]);
        }
        return result;
    },

    tagFor(filter) {
        let result: FilterTag | undefined;
        Filter.registry.find(record => {
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
