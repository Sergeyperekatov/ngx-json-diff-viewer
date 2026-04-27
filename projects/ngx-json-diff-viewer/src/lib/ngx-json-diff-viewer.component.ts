import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormsModule} from '@angular/forms';

export enum DiffType {
	ADDED = 'added',
	CHANGED = 'changed',
	REMOVED = 'removed',
	UNCHANGED = 'unchanged'
}

interface DiffItem {
	oldValue: any;
	newValue: any;
	type: DiffType;
	children?: DiffItem[];
	pathToKey?: string[];
	expanded?: boolean;
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
		// Checking if oldObject or newObject have changed
		if (changes['oldObject'] || changes['newObject'] || changes['ignoreProperties']) {
			try {
				const formattedOldObject = this.formatJson(this.oldObject);
				const formattedNewObject = this.formatJson(this.newObject);
				this.diffTree = this.compareObjects(formattedOldObject, formattedNewObject, this.ignoreProperties);
				this.initializeExpandedState(this.diffTree);
				this.filteredDiffTree = [...this.diffTree];
			} catch (error) {
				console.error("Error when comparing JSON objects:", error);
				this.diffTree = []; // Handling the error (for example, showing a message to the user)
				this.filteredDiffTree = [];
			}
		}
	}
	
	initializeExpandedState(items: DiffItem[]): void {
		items.forEach(item => {
			item.expanded = true;
			item.visible = true;
			if (item.children && item.children.length > 0) {
				this.initializeExpandedState(item.children);
			}
		});
	}
	
	toggleExpand(item: DiffItem): void {
		item.expanded = !item.expanded;
	}
	
	onSearchChange(): void {
		if (this.searchQuery.trim() === '') {
			this.filteredDiffTree = [...this.diffTree];
			this.resetVisibility(this.diffTree);
		} else {
			this.filteredDiffTree = this.filterDiffTree(this.diffTree, this.searchQuery.toLowerCase());
		}
	}
	
	private filterDiffTree(items: DiffItem[], query: string): DiffItem[] {
		const filtered: DiffItem[] = [];
		
		items.forEach(item => {
			const pathMatch = item.pathToKey?.join('/').toLowerCase().includes(query);
			const oldValueMatch = JSON.stringify(item.oldValue).toLowerCase().includes(query);
			const newValueMatch = JSON.stringify(item.newValue).toLowerCase().includes(query);
			
			if (pathMatch || oldValueMatch || newValueMatch) {
				item.visible = true;
				filtered.push(item);
			} else {
				item.visible = false;
			}
			
			if (item.children && item.children.length > 0) {
				const filteredChildren = this.filterDiffTree(item.children, query);
				if (filteredChildren.length > 0) {
					item.visible = true;
					item.expanded = true;
					if (!pathMatch && !oldValueMatch && !newValueMatch) {
						filtered.push(item);
					}
				}
			}
		});
		
		return filtered;
	}
	
	private resetVisibility(items: DiffItem[]): void {
		items.forEach(item => {
			item.visible = true;
			if (item.children && item.children.length > 0) {
				this.resetVisibility(item.children);
			}
		});
	}
	
	exportDiff(): void {
		const exportData = {
			timestamp: new Date().toISOString(),
			oldObject: this.oldObject,
			newObject: this.newObject,
			differences: this.diffTree
		};
		
		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], {type: 'application/json'});
		const url = URL.createObjectURL(dataBlob);
		
		const link = document.createElement('a');
		link.href = url;
		link.download = `diff-export-${Date.now()}.json`;
		link.click();
		
		URL.revokeObjectURL(url);
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
	
	private compareObjects(oldObj: any, newObj: any, path: string[]): DiffItem[] {
		// Handle arrays
		if (Array.isArray(oldObj) && Array.isArray(newObj)) {
			return this.compareArrays(oldObj, newObj, path);
		}
		
		// Handle null/undefined vs object
		if ((oldObj === null || oldObj === undefined) && (newObj === null || newObj === undefined)) {
			return [];
		}
		const diffTree: DiffItem[] = [];
		if (this.deepIsEqual(oldObj, newObj, this.ignoreProperties)) {
			return []; // No change
		}
		// Handle primitive values or null/undefined
		if (typeof oldObj !== 'object' || oldObj === null || typeof newObj !== 'object' || newObj === null) {
			if (!this.deepIsEqual(oldObj, newObj, this.ignoreProperties)) {
				diffTree.push({
					pathToKey: path,
					oldValue: oldObj,
					newValue: newObj,
					type: oldObj === undefined ? DiffType.ADDED : (newObj === undefined ? DiffType.REMOVED : DiffType.CHANGED)
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
						oldValue: oldObj[key], newValue: newObj[key], type: DiffType.CHANGED, children, pathToKey: newPath
					})
				}
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
			if (this.ignoreProperties.includes(key)) continue;
			if (!newObj.hasOwnProperty(key)) {
				diffTree.push({
					oldValue: oldObj[key],
					newValue: undefined,
					type: DiffType.REMOVED,
					pathToKey: path.length === 0 ? [key] : [...path, key]
				});
			}
		}
		return diffTree;
	}
	
	private compareArrays(oldArr: any[], newArr: any[], path: string[]): DiffItem[] {
		const diffTree: DiffItem[] = [];
		const maxLength = Math.max(oldArr.length, newArr.length);
		
		for (let i = 0; i < maxLength; i++) {
			const newPath = [...path, `[${i}]`];
			
			if (i >= oldArr.length) {
				// Item added
				diffTree.push({
					pathToKey: newPath,
					oldValue: undefined,
					newValue: newArr[i],
					type: DiffType.ADDED
				});
			} else if (i >= newArr.length) {
				// Item removed
				diffTree.push({
					pathToKey: newPath,
					oldValue: oldArr[i],
					newValue: undefined,
					type: DiffType.REMOVED
				});
			} else {
				// Compare items
				const children = this.compareObjects(oldArr[i], newArr[i], newPath);
				if (children.length > 0) {
					diffTree.push({
						pathToKey: newPath,
						oldValue: oldArr[i],
						newValue: newArr[i],
						type: DiffType.CHANGED,
						children
					});
				}
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
