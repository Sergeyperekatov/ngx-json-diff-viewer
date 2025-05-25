import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';

interface DiffItem {
	oldValue: any;
	newValue: any;
	type: 'added' | 'changed' | 'removed' | 'unchanged';
	children?: DiffItem[];
	pathToKey?: string[];
}

@Component({
	selector: 'lib-ngx-json-diff-viewer',
	templateUrl: './ngx-data-diff-viewer.component.html',
	styleUrls: ['./ngx-data-diff-viewer.component.css']
})

export class NgxJsonDiffViewerComponent implements OnChanges {
	diffTree: DiffItem[] = [];
	
	@Input() oldObject: string = '';
	@Input() newObject: string = '';
	@Input() ignoreProperties: string[] = [];
	
	ngOnChanges(changes: SimpleChanges): void {
		// Checking if oldObject or newObject have changed
		if (changes['oldObject'] || changes['newObject'] || changes['ignoreProperties']) {
			try {
				const formattedOldObject = this.formatJson(this.oldObject);
				const formattedNewObject = this.formatJson(this.newObject);
				this.diffTree = this.compareObjects(formattedOldObject, formattedNewObject, this.ignoreProperties);
				this.extractionChildDiff();
			} catch (error) {
				console.error("Error when comparing JSON objects:", error);
				this.diffTree = []; // Handling the error (for example, showing a message to the user)
			}
		}
	}
	
	private compareObjects(oldObj: any, newObj: any, path: string[]): DiffItem[] {
		const diffTree: DiffItem[] = [];
		if (this.deepIsEqual(oldObj, newObj, this.ignoreProperties)) {
			return []; // No change
		}
		if (typeof oldObj !== 'object' || oldObj === null || typeof newObj !== 'object' || newObj === null) {
			if (!this.deepIsEqual(oldObj, newObj, this.ignoreProperties)) {
				diffTree.push({
					pathToKey: path,
					oldValue: oldObj,
					newValue: newObj,
					type: oldObj === undefined ? 'added' : (newObj === undefined ? 'removed' : 'changed')
				});
			}
			return diffTree;
		}
		const oldKeys = Object.keys(oldObj);
		const newKeys = Object.keys(newObj);
		for (const key of newKeys) {
			if (this.ignoreProperties.includes(key)) continue;
			if (oldObj.hasOwnProperty(key)) {
				const newPath = [...path, key];
				const children = this.compareObjects(oldObj[key], newObj[key], newPath)
				if (children.length > 0) {
					diffTree.push({
						oldValue: oldObj[key], newValue: newObj[key], type: 'changed', children, pathToKey: newPath
					})
				}
			} else {
				diffTree.push({
					oldValue: undefined,
					newValue: newObj[key],
					type: 'added',
					pathToKey: path.length === 0 ? [key] : path
				});
			}
		}
		for (const key of oldKeys) {
			if (this.ignoreProperties.includes(key)) continue;
			if (!newObj.hasOwnProperty(key)) {
				diffTree.push({
					oldValue: oldObj[key],
					newValue: undefined,
					type: 'removed',
					pathToKey: path.length === 0 ? [key] : path
				});
			}
		}
		return diffTree;
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
	
	formatJson(json: string): any {
		return JSON.parse(json);
	}
	
	extractionChildDiff() {
		const diffArr: DiffItem[] = [];
		this.diffTree.forEach((diffItem, index) => {
			this.findDeepestChildValues(diffItem, diffArr);
		});
		this.diffTree = diffArr;
	}
	
	findDeepestChildValues(diffItem: DiffItem, diffArr: DiffItem[]): DiffItem | null {
		if (!diffItem) {
			return null; // Or another default value
		}
		if (!diffItem.children || diffItem.children.length === 0) {
			// There are no child elements, so this is the deepest level.
			diffArr.push({
				type: diffItem.type,
				pathToKey: diffItem.pathToKey,
				oldValue: diffItem.oldValue,
				newValue: diffItem.newValue
			});
			return {
				type: diffItem.type,
				pathToKey: diffItem.pathToKey,
				oldValue: diffItem.oldValue,
				newValue: diffItem.newValue
			};
		}
		let deepestChild: DiffItem | null = null;
		for (const child of diffItem.children) {
			const childResult = this.findDeepestChildValues(child, diffArr);
			if (childResult) {
				deepestChild = childResult;
			}
		}
		return deepestChild;
	}
}
