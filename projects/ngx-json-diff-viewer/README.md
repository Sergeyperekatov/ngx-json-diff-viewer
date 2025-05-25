# NgxJsonDiffViewer

[![npm version](https://badge.fury.io/js/ngx-json-diff-viewer.svg)](https://badge.fury.io/js/ngx-json-diff-viewer)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Angular Version](https://img.shields.io/badge/Angular-%3E%3D14-red)](https://angular.io/)

**Angular component for visually displaying the differences between two JSON objects.**


## Features

*   **Clear Visual Representation:** Presents JSON differences in an easy-to-understand format, highlighting added, removed, and modified values.
*   **Customizable Styling:** Allows customization of colors and styles to match your application's theme.
*   **Easy Integration:** Simple to integrate into your Angular projects.
*   **Tree-like Structure:** Displays JSON data in a collapsible tree-like structure.
*   **Handles Complex Objects:** Works well with nested objects, arrays, and primitive data types.
*   **Ignore Properties:** Ability to ignore specific properties during the diff comparison.

## Installation
npm install ngx-json-diff-viewer

## Input Properties

| Input             | Type       | Description                                                                                       |
|--------------------|------------|---------------------------------------------------------------------------------------------------|
| `oldObject`       | `any`      | The original JSON object.                                                                           |
| `newObject`       | `any`      | The modified JSON object.                                                                           |
| `ignoreProperties`| `string[]` | (Optional) An array of property names to ignore when calculating the diff.                           |

