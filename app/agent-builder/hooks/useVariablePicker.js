'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useVariablePicker = useVariablePicker;
var react_1 = require("react");
var getPreviewValue = function (executionResults, path) {
    if (!executionResults)
        return '';
    var parts = path.split('.');
    var current = executionResults;
    for (var _i = 0, parts_1 = parts; _i < parts_1.length; _i++) {
        var part = parts_1[_i];
        if (current === undefined || current === null) {
            return '';
        }
        current = current === null || current === void 0 ? void 0 : current[part];
    }
    if (current === undefined || current === null)
        return '';
    var str = String(current);
    return str.length > 50 ? "".concat(str.slice(0, 50), "...") : str;
};
var flattenObjectPaths = function (obj, prefix) {
    if (prefix === void 0) { prefix = ''; }
    if (obj === null || obj === undefined)
        return [];
    if (typeof obj !== 'object')
        return [prefix];
    return Object.entries(obj).flatMap(function (_a) {
        var key = _a[0], value = _a[1];
        var path = prefix ? "".concat(prefix, ".").concat(key) : key;
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            return flattenObjectPaths(value, path);
        }
        return [path];
    });
};
function useVariablePicker(currentNodeId, nodes, edges, executionResults) {
    var getPreviousNodes = function () {
        var visited = new Set();
        var previous = [];
        var traverse = function (nodeId) {
            var incomingEdges = edges.filter(function (e) { return e.target === nodeId; });
            var _loop_1 = function (edge) {
                if (!visited.has(edge.source)) {
                    visited.add(edge.source);
                    var node = nodes.find(function (n) { return n.id === edge.source; });
                    if (node) {
                        traverse(edge.source);
                        previous.push(node);
                    }
                }
            };
            for (var _i = 0, incomingEdges_1 = incomingEdges; _i < incomingEdges_1.length; _i++) {
                var edge = incomingEdges_1[_i];
                _loop_1(edge);
            }
        };
        if (currentNodeId) {
            traverse(currentNodeId);
        }
        return previous;
    };
    var getVariablesForNode = function (node) {
        var _a, _b, _c;
        var nodeId = node.id;
        var nodeType = ((_a = node.data) === null || _a === void 0 ? void 0 : _a.type) || node.type || '';
        var nodeLabel = ((_b = node.data) === null || _b === void 0 ? void 0 : _b.label) || nodeId;
        var vars = [];
        var addVariable = function (path, displayPath, description, category) {
            var fullPath = "".concat(nodeId, ".").concat(path);
            vars.push({
                nodeId: nodeId,
                nodeLabel: nodeLabel,
                nodeType: nodeType,
                path: fullPath,
                displayPath: "".concat(nodeId, ".").concat(displayPath),
                description: description,
                category: category,
                preview: getPreviewValue(executionResults, fullPath),
            });
        };
        addVariable('output.text', 'output.text', 'Main text output', 'output');
        addVariable('output.message', 'output.message', 'Status message', 'output');
        if (nodeType.startsWith('ai-')) {
            addVariable('output.text', 'output.text', 'AI generated response', 'output');
        }
        if (nodeType.includes('search')) {
            addVariable('output.text', 'output.text', 'Search results as text', 'output');
            addVariable('output.data.resultCount', 'output.data.resultCount', 'Number of results found', 'data');
            addVariable('output.data.query', 'output.data.query', 'Search query used', 'data');
        }
        if (nodeType === 'trigger-manual') {
            addVariable('output.market', 'output.market', 'Market field', 'output');
            addVariable('output.topic', 'output.topic', 'Topic field', 'output');
            addVariable('output.timeScope', 'output.timeScope', 'Time scope field', 'output');
        }
        if (nodeType === 'core-set') {
            addVariable('output.data.market', 'output.data.market', 'Market variable', 'data');
            addVariable('output.data.topic', 'output.data.topic', 'Topic variable', 'data');
            addVariable('output.data.today', 'output.data.today', 'Today date', 'data');
        }
        if (nodeType === 'action-email') {
            addVariable('output.data.recipient', 'output.data.recipient', 'Email recipient', 'data');
        }
        if (nodeType.includes('http')) {
            addVariable('output.data.status', 'output.data.status', 'HTTP response status', 'data');
            addVariable('output.data.body', 'output.data.body', 'HTTP response body', 'data');
        }
        var nodeResult = executionResults === null || executionResults === void 0 ? void 0 : executionResults[nodeId];
        var outputData = (_c = nodeResult === null || nodeResult === void 0 ? void 0 : nodeResult.output) !== null && _c !== void 0 ? _c : nodeResult;
        if (outputData && typeof outputData === 'object') {
            var flattened = flattenObjectPaths(outputData, 'output');
            flattened.forEach(function (path) {
                addVariable(path, path, 'Resolved output field from execution result', 'data');
            });
        }
        else {
            addVariable('output.data', 'output.data', 'Output data object; append .fieldName for a specific field', 'data');
        }
        var seen = new Set();
        return vars.filter(function (v) {
            if (seen.has(v.path))
                return false;
            seen.add(v.path);
            return true;
        });
    };
    var availableVariables = (0, react_1.useMemo)(function () {
        var previousNodes = getPreviousNodes();
        return previousNodes.flatMap(getVariablesForNode);
    }, [currentNodeId, nodes, edges, executionResults]);
    return { availableVariables: availableVariables, getPreviousNodes: getPreviousNodes };
}
