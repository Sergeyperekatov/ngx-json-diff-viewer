import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';

export enum DiffType {
	ADDED = 'added',
	CHANGED = 'changed',
	REMOVED = 'removed'
}

interface DiffItem {
    oldValue: any;
    newValue: any;
    type: DiffType;
    pathToKey?: string[];
    visible?: boolean;
}

@Component({
	selector: 'lib-ngx-json-diff-viewer',
	templateUrl: './ngx-json-diff-viewer.component.html',
	styleUrls: ['./ngx-json-diff-viewer.component.css']
})

export class NgxJsonDiffViewerComponent implements OnChanges {
	diffTree: DiffItem[] = [];
	filteredDiffTree: DiffItem[] = [];
	searchQuery: string = '';
	
	@Input() oldObject: any = '';
	@Input() newObject: any = '';
	@Input() ignoreProperties: string[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['oldObject'] || changes['newObject'] || changes['ignoreProperties']) {
            try {
                const formattedOldObject = this.formatJson(this.oldObject);
                const formattedNewObject = this.formatJson(this.newObject);
                const diffTree: DiffItem[] = [];
                this.compareObjects(formattedOldObject, formattedNewObject, [], diffTree, this.ignoreProperties);
                this.diffTree = diffTree;
                this.filteredDiffTree = [...this.diffTree];
                this.filteredDiffTree.forEach(item => item.visible = true);
            } catch (error) {
                console.error("Error when comparing JSON objects:", error);
                this.diffTree = [];
                this.filteredDiffTree = [];
            }
        }
    }

	highlightSearch(text: string): string {
		if (!this.searchQuery || !text) {
			return text;
		}
		
		const regex = new RegExp(`(${this.escapeRegExp(this.searchQuery)})`, 'gi');
		return text.replace(regex, '<span class="search-highlight">$1</span>');
	}
	
	private escapeRegExp(string: string): string {
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}

    private compareObjects(oldObj: any, newObj: any, path: string[], diffTree: DiffItem[], ignoreProps: string[]): void {
        if (this.deepIsEqual(oldObj, newObj, ignoreProps)) {
            return;
        }
        if (typeof oldObj !== 'object' || oldObj === null || typeof newObj !== 'object' || newObj === null) {
            if (!this.deepIsEqual(oldObj, newObj, ignoreProps)) {
                diffTree.push({
                    pathToKey: path.length === 0 ? ['root'] : path,
                    oldValue: oldObj,
                    newValue: newObj,
                    type: oldObj === undefined ? DiffType.ADDED : (newObj === undefined ? DiffType.REMOVED : DiffType.CHANGED)
                });
            }
            return;
        }
        if (Array.isArray(oldObj) && Array.isArray(newObj)) {
            this.compareArrays(oldObj, newObj, path, diffTree, ignoreProps);
            return;
        }
        const oldKeys = Object.keys(oldObj);
        const newKeys = Object.keys(newObj);
        for (const key of newKeys) {
            if (ignoreProps.includes(key)) continue;
            if (oldObj.hasOwnProperty(key)) {
                this.compareObjects(oldObj[key], newObj[key], [...path, key], diffTree, ignoreProps);
            } else {
                diffTree.push({
                    oldValue: undefined,
                    newValue: newObj[key],
                    type: DiffType.ADDED,
                    pathToKey: path.length === 0 ? [key] : [...path, key]
                });
            }
        }
        for (const key of oldKeys) {
            if (ignoreProps.includes(key)) continue;
            if (!newObj.hasOwnProperty(key)) {
                diffTree.push({
                    oldValue: oldObj[key],
                    newValue: undefined,
                    type: DiffType.REMOVED,
                    pathToKey: path.length === 0 ? [key] : [...path, key]
                });
            }
        }
    }

    private compareArrays(oldArr: any[], newArr: any[], path: string[], diffTree: DiffItem[], ignoreProps: string[]): void {
        const maxLength = Math.max(oldArr.length, newArr.length);
        for (let i = 0; i < maxLength; i++) {
            const newPath = [...path, `[${i}]`];
            if (i >= oldArr.length) {
                diffTree.push({
                    pathToKey: newPath,
                    oldValue: undefined,
                    newValue: newArr[i],
                    type: DiffType.ADDED
                });
            } else if (i >= newArr.length) {
                diffTree.push({
                    pathToKey: newPath,
                    oldValue: oldArr[i],
                    newValue: undefined,
                    type: DiffType.REMOVED
                });
            } else {
                this.compareObjects(oldArr[i], newArr[i], newPath, diffTree, ignoreProps);
            }
        }
    }
	
	private deepIsEqual(obj1: any, obj2: any, ignoreProps: string[]): boolean {
		if (obj1 === obj2) {
			return true;
		}
		if (typeof obj1 !== typeof obj2 || obj1 === null || obj2 === null) {
			return false;
		}
		if (typeof obj1 !== 'object') {
			return obj1 === obj2;
		}
		const keys1 = Object.keys(obj1);
		const keys2 = Object.keys(obj2);
		if (keys1.length !== keys2.length) {
			return false;
		}
		for (const key of keys1) {
			if (ignoreProps.includes(key)) continue;
			if (!obj2.hasOwnProperty(key) || !this.deepIsEqual(obj1[key], obj2[key], ignoreProps)) {
				return false;
			}
		}
		return true;
	}
	
	formatJson(data: any): any {
		if (typeof data === 'string') {
			try {
				return JSON.parse(data);
			} catch (e) {
				console.error("Error parsing JSON string:", e);
				return data;
			}
		} else if (typeof data === 'object') {
			return data;
		} else {
			console.warn("Unsupported data type.  Expected string or object.");
			return data;
		}
	}
	
}
