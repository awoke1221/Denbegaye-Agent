'use client';
"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeManagement = NodeManagement;
var react_1 = require("react");
var button_1 = require("@/components/ui/button");
var input_1 = require("@/components/ui/input");
var label_1 = require("@/components/ui/label");
var AuthContext_1 = require("@/contexts/AuthContext");
var select_1 = require("@/components/ui/select");
var badge_1 = require("@/components/ui/badge");
var lucide_react_1 = require("lucide-react");
var supabaseClient_1 = require("@/lib/supabaseClient");
var nodeTypes_1 = require("../constants/nodeTypes");
var useVariablePicker_1 = require("../hooks/useVariablePicker");
var VariableInput_1 = require("./VariableInput");
var VariableTextarea_1 = require("./VariableTextarea");
function NodeManagement(_a) {
    var _this = this;
    var _b, _c, _d, _e, _f, _g, _h, _j, _k;
    var activeSection = _a.activeSection, showNodePalette = _a.showNodePalette, setShowNodePalette = _a.setShowNodePalette, searchQuery = _a.searchQuery, setSearchQuery = _a.setSearchQuery, nodePalettePosition = _a.nodePalettePosition, settingsPosition = _a.settingsPosition, nodeConfigPosition = _a.nodeConfigPosition, draggingPane = _a.draggingPane, setDraggingPane = _a.setDraggingPane, dragOffset = _a.dragOffset, setDragOffset = _a.setDragOffset, selectedNode = _a.selectedNode, selectedNodeId = _a.selectedNodeId, nodes = _a.nodes, edges = _a.edges, credentials = _a.credentials, credentialForm = _a.credentialForm, setCredentialForm = _a.setCredentialForm, loadCredentials = _a.loadCredentials, loadCredentialIntoNode = _a.loadCredentialIntoNode, updateNodeConfig = _a.updateNodeConfig, apiKeys = _a.apiKeys, setApiKeys = _a.setApiKeys, saveApiKeys = _a.saveApiKeys, renderIcon = _a.renderIcon, selectNode = _a.selectNode, copyConfig = _a.copyConfig, duplicateNode = _a.duplicateNode, duplicateEdge = _a.duplicateEdge, undo = _a.undo, redo = _a.redo, setContextMenu = _a.setContextMenu, contextMenu = _a.contextMenu, setNodes = _a.setNodes, setEdges = _a.setEdges, setActiveSection = _a.setActiveSection, setLog = _a.setLog, nodeTypeCategory = _a.nodeTypeCategory, isNodeConfigured = _a.isNodeConfigured;
    var _l = (0, AuthContext_1.useAuth)(), user = _l.user, signInWithGoogleForService = _l.signInWithGoogleForService;
    var _m = (0, react_1.useState)([]), availableSpreadsheets = _m[0], setAvailableSpreadsheets = _m[1];
    var _o = (0, react_1.useState)([]), availableSheetNames = _o[0], setAvailableSheetNames = _o[1];
    var _p = (0, react_1.useState)(false), googleMetadataLoading = _p[0], setGoogleMetadataLoading = _p[1];
    var _q = (0, react_1.useState)(null), googleMetadataError = _q[0], setGoogleMetadataError = _q[1];
    var getStoredServiceToken = function (service) {
        if (typeof window === 'undefined')
            return null;
        var stored = window.localStorage.getItem("serviceToken:".concat(service));
        if (!stored)
            return null;
        try {
            var parsed = JSON.parse(stored);
            var now = Date.now();
            var oneHour = 60 * 60 * 1000;
            if (parsed.access_token && now - parsed.timestamp < oneHour) {
                return parsed.access_token;
            }
            window.localStorage.removeItem("serviceToken:".concat(service));
        }
        catch (error) {
            console.error('Failed to parse stored service token', error);
            window.localStorage.removeItem("serviceToken:".concat(service));
        }
        return null;
    };
    var getServiceToken = function (service) { return __awaiter(_this, void 0, void 0, function () {
        var config, serviceTokens, tokenTimestamp, now, oneHour;
        var _a, _b;
        return __generator(this, function (_c) {
            config = (((_a = selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.data) === null || _a === void 0 ? void 0 : _a.config) || {});
            serviceTokens = config.serviceTokens || {};
            if ((_b = serviceTokens[service]) === null || _b === void 0 ? void 0 : _b.access_token) {
                tokenTimestamp = serviceTokens[service].timestamp;
                now = Date.now();
                oneHour = 60 * 60 * 1000;
                if (now - tokenTimestamp < oneHour) {
                    return [2 /*return*/, serviceTokens[service].access_token];
                }
            }
            return [2 /*return*/, getStoredServiceToken(service)];
        });
    }); };
    var authenticateService = function (service) { return __awaiter(_this, void 0, void 0, function () {
        var result, serviceTokens, error_1;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    if (!selectedNode) {
                        throw new Error('No node selected for service authentication.');
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, signInWithGoogleForService(service, selectedNode.id)];
                case 2:
                    result = _c.sent();
                    if (result) {
                        serviceTokens = (((_b = (_a = selectedNode.data) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.serviceTokens) || {});
                        serviceTokens[service] = __assign(__assign({}, result), { timestamp: Date.now() });
                        updateNodeConfig(selectedNode.id, { serviceTokens: serviceTokens });
                        return [2 /*return*/, result.access_token];
                    }
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _c.sent();
                    console.error("Failed to authenticate ".concat(service, ":"), error_1);
                    throw error_1;
                case 4: return [2 /*return*/, null];
            }
        });
    }); };
    var getGoogleProviderToken = function () { return __awaiter(_this, void 0, void 0, function () {
        var sessionResponse, session;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabaseClient_1.supabase.auth.getSession()];
                case 1:
                    sessionResponse = _b.sent();
                    session = (_a = sessionResponse.data) === null || _a === void 0 ? void 0 : _a.session;
                    if (session === null || session === void 0 ? void 0 : session.provider_token) {
                        return [2 /*return*/, session.provider_token];
                    }
                    return [4 /*yield*/, getServiceToken('sheets')];
                case 2: return [2 /*return*/, _b.sent()];
            }
        });
    }); };
    var updateGoogleAuthConfig = function () { return __awaiter(_this, void 0, void 0, function () {
        var config, token, error_2;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!selectedNode || selectedNode.type !== 'data-google-sheets')
                        return [2 /*return*/];
                    config = (((_a = selectedNode.data) === null || _a === void 0 ? void 0 : _a.config) || {});
                    if (!(config.authMethod === 'google-oauth')) return [3 /*break*/, 6];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, getServiceToken('sheets')];
                case 2:
                    token = _b.sent();
                    if (!!token) return [3 /*break*/, 4];
                    return [4 /*yield*/, authenticateService('sheets')];
                case 3:
                    token = _b.sent();
                    _b.label = 4;
                case 4:
                    if (token) {
                        updateNodeConfig(selectedNode.id, { providerToken: token });
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_2 = _b.sent();
                    console.error('Failed to get provider token', error_2);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var fetchGoogleSpreadsheets = function () { return __awaiter(_this, void 0, void 0, function () {
        var token, query, response, data, error_3;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setGoogleMetadataError(null);
                    setGoogleMetadataLoading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, getServiceToken('sheets')];
                case 2:
                    token = _b.sent();
                    if (!!token) return [3 /*break*/, 4];
                    return [4 /*yield*/, authenticateService('sheets')];
                case 3:
                    token = _b.sent();
                    _b.label = 4;
                case 4:
                    if (!token) {
                        setGoogleMetadataError('No Google access token available. Please connect your Google account with Drive and Sheets permissions using the "Connect Google" button above.');
                        return [2 /*return*/];
                    }
                    query = "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false";
                    return [4 /*yield*/, fetch("https://www.googleapis.com/drive/v3/files?fields=files(id,name)&q=".concat(encodeURIComponent(query)), {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                            },
                        })];
                case 5:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 6:
                    data = _b.sent();
                    if (!response.ok) {
                        throw new Error(((_a = data.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unable to load Google Sheets files.');
                    }
                    setAvailableSpreadsheets(data.files || []);
                    return [3 /*break*/, 9];
                case 7:
                    error_3 = _b.sent();
                    console.error('Error loading Google spreadsheets', error_3);
                    setGoogleMetadataError(error_3 instanceof Error ? error_3.message : 'Unable to fetch Google spreadsheets.');
                    return [3 /*break*/, 9];
                case 8:
                    setGoogleMetadataLoading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var fetchGoogleSheetNames = function (spreadsheetId) { return __awaiter(_this, void 0, void 0, function () {
        var token, response, data, sheets, error_4;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!spreadsheetId) {
                        setAvailableSheetNames([]);
                        return [2 /*return*/];
                    }
                    setGoogleMetadataError(null);
                    setGoogleMetadataLoading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, getServiceToken('sheets')];
                case 2:
                    token = _b.sent();
                    if (!!token) return [3 /*break*/, 4];
                    return [4 /*yield*/, authenticateService('sheets')];
                case 3:
                    token = _b.sent();
                    _b.label = 4;
                case 4:
                    if (!token) {
                        setGoogleMetadataError('No Google access token available. Please connect your Google account with Drive and Sheets permissions using the "Connect Google" button above.');
                        setAvailableSheetNames([]);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fetch("https://sheets.googleapis.com/v4/spreadsheets/".concat(encodeURIComponent(spreadsheetId), "?fields=sheets(properties(title))"), {
                            headers: {
                                Authorization: "Bearer ".concat(token),
                            },
                        })];
                case 5:
                    response = _b.sent();
                    return [4 /*yield*/, response.json()];
                case 6:
                    data = _b.sent();
                    if (!response.ok) {
                        throw new Error(((_a = data.error) === null || _a === void 0 ? void 0 : _a.message) || 'Unable to load sheet tabs.');
                    }
                    sheets = (data.sheets || [])
                        .map(function (sheet) { var _a; return ((_a = sheet.properties) === null || _a === void 0 ? void 0 : _a.title) || ''; })
                        .filter(Boolean);
                    setAvailableSheetNames(sheets);
                    return [3 /*break*/, 9];
                case 7:
                    error_4 = _b.sent();
                    console.error('Failed to load sheet names', error_4);
                    setGoogleMetadataError(error_4 instanceof Error ? error_4.message : 'Unable to fetch sheet names.');
                    setAvailableSheetNames([]);
                    return [3 /*break*/, 9];
                case 8:
                    setGoogleMetadataLoading(false);
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        var _a;
        if (!selectedNode)
            return;
        var config = (((_a = selectedNode.data) === null || _a === void 0 ? void 0 : _a.config) || {});
        if (config.authMethod !== 'google-oauth') {
            setAvailableSpreadsheets([]);
            setAvailableSheetNames([]);
            setGoogleMetadataError(null);
            return;
        }
        updateGoogleAuthConfig();
        fetchGoogleSpreadsheets();
        if (config.spreadsheetId) {
            fetchGoogleSheetNames(config.spreadsheetId);
        }
        else {
            setAvailableSheetNames([]);
        }
    }, [
        selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.id,
        (_c = (_b = selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.data) === null || _b === void 0 ? void 0 : _b.config) === null || _c === void 0 ? void 0 : _c.authMethod,
        (_e = (_d = selectedNode === null || selectedNode === void 0 ? void 0 : selectedNode.data) === null || _d === void 0 ? void 0 : _d.config) === null || _e === void 0 ? void 0 : _e.spreadsheetId,
        user === null || user === void 0 ? void 0 : user.id,
    ]);
    var availableVariables = (0, useVariablePicker_1.useVariablePicker)(selectedNodeId !== null && selectedNodeId !== void 0 ? selectedNodeId : '', nodes, edges).availableVariables;
    var renderVariableInput = function (_a) {
        var label = _a.label, value = _a.value, onChange = _a.onChange, placeholder = _a.placeholder, required = _a.required, description = _a.description, disabled = _a.disabled, fieldKey = _a.fieldKey, _b = _a.type, type = _b === void 0 ? 'text' : _b, className = _a.className;
        return (<VariableInput_1.VariableInput label={label} value={value} onChange={onChange} placeholder={placeholder} required={required} description={description} disabled={disabled} fieldKey={fieldKey} availableVariables={availableVariables} type={type} className={className}/>);
    };
    var renderVariableTextarea = function (_a) {
        var label = _a.label, value = _a.value, onChange = _a.onChange, placeholder = _a.placeholder, required = _a.required, description = _a.description, disabled = _a.disabled, fieldKey = _a.fieldKey, rows = _a.rows, className = _a.className;
        return (<VariableTextarea_1.VariableTextarea label={label} value={value} onChange={onChange} placeholder={placeholder} required={required} description={description} disabled={disabled} fieldKey={fieldKey} availableVariables={availableVariables} rows={rows} className={className}/>);
    };
    var groupedNodeTypes = (0, react_1.useMemo)(function () {
        return nodeTypes_1.availableNodeTypes.reduce(function (acc, node) {
            if (!acc[node.category])
                acc[node.category] = [];
            if (!acc[node.category].some(function (existing) { return existing.id === node.id; })) {
                acc[node.category].push(node);
            }
            return acc;
        }, {});
    }, []);
    var renderNodeConfigForm = function (node) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39, _40, _41, _42, _43, _44, _45, _46, _47, _48, _49, _50, _51, _52, _53, _54, _55, _56, _57, _58, _59, _60, _61, _62, _63, _64, _65, _66;
        var config = (node.data.config || {});
        var credentialOptions = credentials.map(function (cred) { return ({
            value: cred.provider,
            label: cred.label || cred.provider,
        }); });
        var normalizeConfigKey = function (label) {
            return label
                .replace(/[^a-zA-Z0-9]+/g, ' ')
                .trim()
                .split(' ')
                .map(function (part, index) {
                return index === 0 ? part.toLowerCase() : part.charAt(0).toUpperCase() + part.slice(1);
            })
                .join('');
        };
        var getNodeTypeMetadata = function (type) {
            return type ? nodeTypes_1.availableNodeTypes.find(function (nodeType) { return nodeType.id === type; }) : undefined;
        };
        var renderConfigField = function (node, field) {
            var _a, _b, _c, _d;
            var key = normalizeConfigKey(field.l);
            var rawValue = (_b = (_a = node.data) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b[key];
            var value = rawValue === undefined
                ? field.t === 'checkbox' || field.t === 'boolean'
                    ? false
                    : ''
                : rawValue;
            // Check if field should be displayed based on condition
            if (field.condition) {
                var shouldShow = field.condition(((_c = node.data) === null || _c === void 0 ? void 0 : _c.config) || {});
                if (!shouldShow)
                    return null;
            }
            var updateValue = function (newValue) {
                var _a;
                updateNodeConfig(node.id, (_a = {}, _a[key] = newValue, _a));
            };
            return (<div key={"".concat(node.id, "-").concat(key)}>
          {field.t === 'checkbox' || field.t === 'boolean' ? (<div className="flex items-center gap-2 mt-2">
              <input type="checkbox" checked={Boolean(value)} onChange={function (e) { return updateValue(e.target.checked); }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
              <span className="text-xs text-slate-700 dark:text-slate-300">
                {field.h || field.l}
              </span>
            </div>) : field.t === 'select' ? (<>
              <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {field.l}
                {field.required !== false ? ' *' : ''}
              </label_1.Label>
              <select_1.Select value={String(value)} onValueChange={updateValue}>
                <select_1.SelectTrigger className="mt-1 w-full">
                  <select_1.SelectValue placeholder={"Select ".concat(field.l)}/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  {(_d = field.o) === null || _d === void 0 ? void 0 : _d.map(function (option) { return (<select_1.SelectItem key={option} value={option}>
                      {option}
                    </select_1.SelectItem>); })}
                </select_1.SelectContent>
              </select_1.Select>
            </>) : field.t === 'textarea' ? (<VariableTextarea_1.VariableTextarea label={field.l} fieldKey={"".concat(node.id, "-").concat(key)} value={String(value)} onChange={function (value) { return updateValue(value); }} placeholder={field.h} required={field.required !== false} availableVariables={availableVariables} description={field.h} className="mt-1 h-40"/>) : field.t === 'password' ? (<VariableInput_1.VariableInput label={field.l} fieldKey={"".concat(node.id, "-").concat(key)} value={String(value)} onChange={function (value) { return updateValue(value); }} placeholder={field.h} required={field.required !== false} availableVariables={availableVariables} type="password" description={field.h} className="mt-1"/>) : field.t === 'number' ? (<input_1.Input type="number" value={value === false ? '' : String(value)} onChange={function (e) { return updateValue(Number(e.target.value)); }} placeholder={field.h} className="mt-1"/>) : (<VariableInput_1.VariableInput label={field.l} fieldKey={"".concat(node.id, "-").concat(key)} value={String(value)} onChange={function (value) { return updateValue(value); }} placeholder={field.h} required={field.required !== false} availableVariables={availableVariables} description={field.h} className="mt-1"/>)}
          {field.h && field.t !== 'checkbox' && field.t !== 'select' && (<p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{field.h}</p>)}
        </div>);
        };
        var renderGenericNodeConfig = function (node) {
            var _a;
            var metadata = getNodeTypeMetadata(node.type);
            if (!((_a = metadata === null || metadata === void 0 ? void 0 : metadata.configs) === null || _a === void 0 ? void 0 : _a.length))
                return null;
            return (<div className="space-y-4">
          {metadata.configs.map(function (field) { return renderConfigField(node, field); }).filter(Boolean)}
        </div>);
        };
        var commonInputs = (<>
        <div>
          <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Credential
          </label_1.Label>
          <select_1.Select value={config.credentialProvider || 'manual'} onValueChange={function (value) {
                return updateNodeConfig(node.id, {
                    credentialProvider: value === 'manual' ? null : value,
                });
            }}>
            <select_1.SelectTrigger className="mt-1 w-full">
              <select_1.SelectValue placeholder="Select credential"/>
            </select_1.SelectTrigger>
            <select_1.SelectContent>
              {credentialOptions.map(function (option) { return (<select_1.SelectItem key={option.value} value={option.value}>
                  {option.label}
                </select_1.SelectItem>); })}
            </select_1.SelectContent>
          </select_1.Select>
        </div>
        <div>
          <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
            API Key / Credential
          </label_1.Label>
          <input_1.Input type="password" value={config.apiKey || ''} onChange={function (e) { return updateNodeConfig(node.id, { apiKey: e.target.value }); }} placeholder="Use a saved credential or paste a key" className="mt-1"/>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gemini nodes require either a saved credential or a direct API key.
          </p>
        </div>
      </>);
        switch (node.type) {
            // HARDCODED GEMINI CONFIG DISABLED - Using generic renderer instead
            // See nodeTypes.tsx for Gemini AI node configuration metadata
            case 'data-google-sheets':
                return (<div className="space-y-4">
            <div>
              <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Authentication Method
              </label_1.Label>
              <select_1.Select value={config.authMethod || 'manual'} onValueChange={function (value) {
                        return updateNodeConfig(node.id, {
                            authMethod: value,
                            credentialProvider: value === 'google-oauth' ? null : config.credentialProvider,
                        });
                    }}>
                <select_1.SelectTrigger className="mt-1 w-full">
                  <select_1.SelectValue placeholder="Select authentication method"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="google-oauth">Google OAuth</select_1.SelectItem>
                  <select_1.SelectItem value="manual">Manual or Saved Credential</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            {config.authMethod === 'google-oauth' ? (<div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Google Sheets Account
                    </label_1.Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {((_b = (_a = config.serviceTokens) === null || _a === void 0 ? void 0 : _a.sheets) === null || _b === void 0 ? void 0 : _b.access_token)
                            ? "Connected to Google Sheets"
                            : 'Connect a separate Google account for Sheets access.'}
                    </p>
                  </div>
                  <button_1.Button size="sm" variant="secondary" onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_5;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, authenticateService('sheets')];
                                    case 1:
                                        _a.sent();
                                        setLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['Google Sheets account connected successfully.'], false); });
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_5 = _a.sent();
                                        console.error('Google Sheets authentication failed', error_5);
                                        setLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['Google Sheets authentication failed.'], false); });
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }} className="mt-1">
                    {((_d = (_c = config.serviceTokens) === null || _c === void 0 ? void 0 : _c.sheets) === null || _d === void 0 ? void 0 : _d.access_token)
                            ? 'Reconnect Sheets'
                            : 'Connect Sheets'}
                  </button_1.Button>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  This connects to a separate Google account specifically for Google Sheets access,
                  independent of your main login account.
                </p>
              </div>) : (commonInputs)}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Spreadsheet ID
                  </label_1.Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Load available spreadsheets from your connected Google account.
                  </p>
                </div>
                {config.authMethod === 'google-oauth' && (<button_1.Button size="sm" variant="secondary" onClick={fetchGoogleSpreadsheets} disabled={googleMetadataLoading} className="mt-1">
                    {googleMetadataLoading ? 'Loading…' : 'Refresh spreadsheets'}
                  </button_1.Button>)}
              </div>

              {availableSpreadsheets.length > 0 ? (<select_1.Select value={config.spreadsheetId || ''} onValueChange={function (value) {
                            updateNodeConfig(node.id, { spreadsheetId: value });
                        }}>
                  <select_1.SelectTrigger className="mt-1 w-full">
                    <select_1.SelectValue placeholder="Select a spreadsheet"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {availableSpreadsheets.map(function (spreadsheet) { return (<select_1.SelectItem key={spreadsheet.id} value={spreadsheet.id}>
                        {spreadsheet.name}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>) : (<VariableInput_1.VariableInput label="Spreadsheet ID" fieldKey={"".concat(node.id, "-spreadsheetId")} value={config.spreadsheetId || ''} onChange={function (value) { return updateNodeConfig(node.id, { spreadsheetId: value }); }} placeholder="Enter Google Sheets spreadsheet ID" className="mt-1" availableVariables={availableVariables}/>)}

              {config.authMethod === 'google-oauth' &&
                        !availableSpreadsheets.length &&
                        !googleMetadataLoading && (<p className="text-xs text-slate-500 dark:text-slate-400">
                    Use the refresh button to load spreadsheets from the connected Google account.
                  </p>)}
              {googleMetadataError && (<p className="text-xs text-rose-600 dark:text-rose-400">
                  {googleMetadataError}
                  {googleMetadataError.includes('insufficient authentication scopes') && (<span className="block mt-1">
                      Try reconnecting your Google account to grant the necessary permissions.
                    </span>)}
                </p>)}
            </div>
            {availableSheetNames.length > 0 &&
                        [
                            'read',
                            'append',
                            'update',
                            'clear',
                            'find',
                            'upsert',
                            'delete',
                            'bulkDeleteRows',
                            'formatCells',
                        ].includes(config.action || '') && (<div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Sheet Name
                  </label_1.Label>
                  <select_1.Select value={config.sheetName || ''} onValueChange={function (value) { return updateNodeConfig(node.id, { sheetName: value }); }}>
                    <select_1.SelectTrigger className="mt-1 w-full">
                      <select_1.SelectValue placeholder="Select sheet tab"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      {availableSheetNames.map(function (sheetName) { return (<select_1.SelectItem key={sheetName} value={sheetName}>
                          {sheetName}
                        </select_1.SelectItem>); })}
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>)}
            <div>
              <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Action
              </label_1.Label>
              <select_1.Select value={config.action || 'read'} onValueChange={function (value) { return updateNodeConfig(node.id, { action: value }); }}>
                <select_1.SelectTrigger className="mt-1 w-full">
                  <select_1.SelectValue placeholder="Select action"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="read">Read Data</select_1.SelectItem>
                  <select_1.SelectItem value="append">Append Rows</select_1.SelectItem>
                  <select_1.SelectItem value="update">Update Range</select_1.SelectItem>
                  <select_1.SelectItem value="delete">Delete Rows</select_1.SelectItem>
                  <select_1.SelectItem value="clear">Clear Range</select_1.SelectItem>
                  <select_1.SelectItem value="find">Find Rows</select_1.SelectItem>
                  <select_1.SelectItem value="upsert">Upsert Row</select_1.SelectItem>
                  <select_1.SelectItem value="createSpreadsheet">Create Spreadsheet</select_1.SelectItem>
                  <select_1.SelectItem value="createSheet">Create Sheet</select_1.SelectItem>
                  <select_1.SelectItem value="deleteSheet">Delete Sheet</select_1.SelectItem>
                  <select_1.SelectItem value="getMetadata">Get Metadata</select_1.SelectItem>
                  <select_1.SelectItem value="listSpreadsheets">List Spreadsheets</select_1.SelectItem>
                  <select_1.SelectItem value="batchUpdate">Batch Update</select_1.SelectItem>
                  <select_1.SelectItem value="formatCells">Format Cells</select_1.SelectItem>
                  <select_1.SelectItem value="bulkDeleteRows">Bulk Delete Rows</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            {(config.action === 'read' ||
                        config.action === 'append' ||
                        config.action === 'update' ||
                        config.action === 'clear' ||
                        config.action === 'find' ||
                        config.action === 'upsert' ||
                        config.action === 'formatCells') && (<div>
                <VariableInput_1.VariableInput label="Sheet Name or Range" fieldKey={"".concat(node.id, "-sheetNameOrRange")} value={config.sheetName || config.range || ''} onChange={function (value) {
                            if (value.includes('!')) {
                                updateNodeConfig(node.id, { range: value, sheetName: '' });
                            }
                            else {
                                updateNodeConfig(node.id, { sheetName: value, range: '' });
                            }
                        }} placeholder="Sheet1 or Sheet1!A1:B10" className="mt-1" availableVariables={availableVariables}/>
              </div>)}
            {(config.action === 'find' || config.action === 'upsert') && (<>
                <div>
                  <VariableInput_1.VariableInput label="Column" fieldKey={"".concat(node.id, "-column")} value={config.column || ''} onChange={function (value) { return updateNodeConfig(node.id, { column: value }); }} placeholder="Column name or number (e.g., 'Name' or 1)" className="mt-1" availableVariables={availableVariables}/>
                </div>
                <div>
                  <VariableInput_1.VariableInput label="Value" fieldKey={"".concat(node.id, "-value")} value={config.value || ''} onChange={function (value) { return updateNodeConfig(node.id, { value: value }); }} placeholder="Value to match" className="mt-1" availableVariables={availableVariables}/>
                </div>
              </>)}
          </div>);
            case 'data-gmail':
                return (<div className="space-y-4">
            <div>
              <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Authentication Method
              </label_1.Label>
              <select_1.Select value={config.authMethod || 'manual'} onValueChange={function (value) { return updateNodeConfig(node.id, { authMethod: value }); }}>
                <select_1.SelectTrigger className="mt-1 w-full">
                  <select_1.SelectValue placeholder="Select authentication method"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="google-oauth">Google OAuth</select_1.SelectItem>
                  <select_1.SelectItem value="manual">Manual / Saved Credential</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            {config.authMethod === 'google-oauth' ? (<div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Gmail Account
                    </label_1.Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {((_f = (_e = config.serviceTokens) === null || _e === void 0 ? void 0 : _e.gmail) === null || _f === void 0 ? void 0 : _f.access_token)
                            ? "Connected to Gmail"
                            : 'Connect a separate Google account for Gmail access.'}
                    </p>
                  </div>
                  <button_1.Button size="sm" variant="secondary" onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_6;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, authenticateService('gmail')];
                                    case 1:
                                        _a.sent();
                                        setLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['Gmail account connected successfully.'], false); });
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_6 = _a.sent();
                                        console.error('Gmail authentication failed', error_6);
                                        setLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['Gmail authentication failed.'], false); });
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }} className="mt-1">
                    {((_h = (_g = config.serviceTokens) === null || _g === void 0 ? void 0 : _g.gmail) === null || _h === void 0 ? void 0 : _h.access_token)
                            ? 'Reconnect Gmail'
                            : 'Connect Gmail'}
                  </button_1.Button>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  This connects to a separate Google account specifically for Gmail access,
                  independent of your main login account.
                </p>
              </div>) : (commonInputs)}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Action
                </label_1.Label>
                <select_1.Select value={config.action || 'send'} onValueChange={function (value) { return updateNodeConfig(node.id, { action: value }); }}>
                  <select_1.SelectTrigger className="mt-1 w-full">
                    <select_1.SelectValue placeholder="Select Gmail action"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {[
                        'send',
                        'reply',
                        'search',
                        'get',
                        'copy',
                        'move',
                        'updateLabels',
                        'markAsRead',
                        'markAsUnread',
                        'delete',
                        'createDraft',
                        'sendDraft',
                        'listAttachments',
                        'downloadAttachment',
                        'batchSend',
                        'batchDelete',
                        'batchLabel',
                        'createLabel',
                        'deleteLabel',
                        'getThread',
                        'replyToThread',
                        'forward',
                        'createFilter',
                        'apiCall',
                    ].map(function (action) { return (<select_1.SelectItem key={action} value={action}>
                        {action.replace(/([A-Z])/g, ' $1').replace(/^./, function (str) { return str.toUpperCase(); })}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              {/* Basic Email Fields */}
              {(config.action === 'send' ||
                        config.action === 'reply' ||
                        config.action === 'forward' ||
                        config.action === 'batchSend') && (<>
                  <div>
                    <VariableInput_1.VariableInput label="To" fieldKey={"".concat(node.id, "-to")} value={config.to || ''} onChange={function (value) { return updateNodeConfig(node.id, { to: value }); }} placeholder="recipient@example.com" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <VariableInput_1.VariableInput label="Subject" fieldKey={"".concat(node.id, "-subject")} value={config.subject || ''} onChange={function (value) { return updateNodeConfig(node.id, { subject: value }); }} placeholder="Email subject" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <VariableTextarea_1.VariableTextarea label="Body" fieldKey={"".concat(node.id, "-body")} value={config.body || ''} onChange={function (value) { return updateNodeConfig(node.id, { body: value }); }} placeholder="Plain text body" className="mt-1 h-24" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <VariableTextarea_1.VariableTextarea label="HTML Body" fieldKey={"".concat(node.id, "-htmlBody")} value={config.htmlBody || ''} onChange={function (value) { return updateNodeConfig(node.id, { htmlBody: value }); }} placeholder="HTML body content" className="mt-1 h-24" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <VariableInput_1.VariableInput label="Template ID" fieldKey={"".concat(node.id, "-templateId")} value={config.templateId || ''} onChange={function (value) { return updateNodeConfig(node.id, { templateId: value }); }} placeholder="Email template identifier" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                </>)}

              {/* Message/Thread IDs */}
              {(config.action === 'get' ||
                        config.action === 'reply' ||
                        config.action === 'copy' ||
                        config.action === 'move' ||
                        config.action === 'updateLabels' ||
                        config.action === 'markAsRead' ||
                        config.action === 'markAsUnread' ||
                        config.action === 'delete' ||
                        config.action === 'listAttachments' ||
                        config.action === 'downloadAttachment' ||
                        config.action === 'getThread' ||
                        config.action === 'replyToThread') && (<div>
                  <VariableInput_1.VariableInput label="Message ID" fieldKey={"".concat(node.id, "-messageId")} value={config.messageId || ''} onChange={function (value) { return updateNodeConfig(node.id, { messageId: value }); }} placeholder="Gmail message ID" className="mt-1" availableVariables={availableVariables}/>
                </div>)}

              {(config.action === 'getThread' || config.action === 'replyToThread') && (<div>
                  <VariableInput_1.VariableInput label="Thread ID" fieldKey={"".concat(node.id, "-threadId")} value={config.threadId || ''} onChange={function (value) { return updateNodeConfig(node.id, { threadId: value }); }} placeholder="Gmail thread ID" className="mt-1" availableVariables={availableVariables}/>
                </div>)}

              {/* Search Query */}
              {config.action === 'search' && (<div>
                  <VariableInput_1.VariableInput label="Search Query" fieldKey={"".concat(node.id, "-searchQuery")} value={config.searchQuery || ''} onChange={function (value) { return updateNodeConfig(node.id, { searchQuery: value }); }} placeholder="is:unread from:example.com" className="mt-1" availableVariables={availableVariables}/>
                </div>)}

              {/* Label Operations */}
              {(config.action === 'updateLabels' || config.action === 'batchLabel') && (<>
                  <div>
                    <VariableInput_1.VariableInput label="Add Label IDs" fieldKey={"".concat(node.id, "-addLabelIds")} value={config.addLabelIds || ''} onChange={function (value) { return updateNodeConfig(node.id, { addLabelIds: value }); }} placeholder="INBOX,IMPORTANT" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <VariableInput_1.VariableInput label="Remove Label IDs" fieldKey={"".concat(node.id, "-removeLabelIds")} value={config.removeLabelIds || ''} onChange={function (value) { return updateNodeConfig(node.id, { removeLabelIds: value }); }} placeholder="UNREAD,SPAM" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                </>)}

              {/* Draft Operations */}
              {(config.action === 'createDraft' || config.action === 'sendDraft') && (<div>
                  <VariableInput_1.VariableInput label="Draft ID" fieldKey={"".concat(node.id, "-draftId")} value={config.draftId || ''} onChange={function (value) { return updateNodeConfig(node.id, { draftId: value }); }} placeholder="Gmail draft ID" className="mt-1" availableVariables={availableVariables}/>
                </div>)}

              {/* Attachment Operations */}
              {config.action === 'downloadAttachment' && (<>
                  <div>
                    <VariableInput_1.VariableInput label="Attachment ID" fieldKey={"".concat(node.id, "-attachmentId")} value={config.attachmentId || ''} onChange={function (value) { return updateNodeConfig(node.id, { attachmentId: value }); }} placeholder="Attachment ID to download" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <VariableInput_1.VariableInput label="Download Path" fieldKey={"".concat(node.id, "-downloadPath")} value={config.downloadPath || ''} onChange={function (value) { return updateNodeConfig(node.id, { downloadPath: value }); }} placeholder="Local download path" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                </>)}

              {/* Batch Operations */}
              {(config.action === 'batchSend' ||
                        config.action === 'batchDelete' ||
                        config.action === 'batchLabel') && (<div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Batch Size
                  </label_1.Label>
                  <input_1.Input value={config.batchSize || '10'} onChange={function (e) { return updateNodeConfig(node.id, { batchSize: e.target.value }); }} placeholder="Number of items to process (1-100)" className="mt-1" type="number" min="1" max="100"/>
                </div>)}

              {/* Label Management */}
              {(config.action === 'createLabel' || config.action === 'deleteLabel') && (<div>
                  <VariableInput_1.VariableInput label="Label Name" fieldKey={"".concat(node.id, "-labelName")} value={config.labelName || ''} onChange={function (value) { return updateNodeConfig(node.id, { labelName: value }); }} placeholder="Name for the label" className="mt-1" availableVariables={availableVariables}/>
                </div>)}

              {/* API Call */}
              {config.action === 'apiCall' && (<>
                  <div>
                    <VariableInput_1.VariableInput label="API URL" fieldKey={"".concat(node.id, "-apiUrl")} value={config.apiUrl || ''} onChange={function (value) { return updateNodeConfig(node.id, { apiUrl: value }); }} placeholder="Custom Gmail API URL" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      HTTP Method
                    </label_1.Label>
                    <select_1.Select value={config.apiMethod || 'GET'} onValueChange={function (value) { return updateNodeConfig(node.id, { apiMethod: value }); }}>
                      <select_1.SelectTrigger className="mt-1 w-full">
                        <select_1.SelectValue placeholder="Select HTTP method"/>
                      </select_1.SelectTrigger>
                      <select_1.SelectContent>
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(function (method) { return (<select_1.SelectItem key={method} value={method}>
                            {method}
                          </select_1.SelectItem>); })}
                      </select_1.SelectContent>
                    </select_1.Select>
                  </div>
                </>)}

              {/* From Address */}
              <div>
                <VariableInput_1.VariableInput label="From Address" fieldKey={"".concat(node.id, "-defaultFrom")} value={config.defaultFrom || ''} onChange={function (value) { return updateNodeConfig(node.id, { defaultFrom: value }); }} placeholder="sender@example.com or me" className="mt-1" availableVariables={availableVariables}/>
              </div>
            </div>
          </div>);
            case 'trigger-gmail':
                return (<div className="space-y-4">
            <div>
              <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Authentication Method
              </label_1.Label>
              <select_1.Select value={config.authMethod || 'manual'} onValueChange={function (value) { return updateNodeConfig(node.id, { authMethod: value }); }}>
                <select_1.SelectTrigger className="mt-1 w-full">
                  <select_1.SelectValue placeholder="Select authentication method"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="google-oauth">Google OAuth</select_1.SelectItem>
                  <select_1.SelectItem value="manual">Manual / Saved Credential</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            {config.authMethod === 'google-oauth' ? (<div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Gmail Trigger Account
                    </label_1.Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {((_k = (_j = config.serviceTokens) === null || _j === void 0 ? void 0 : _j.gmail) === null || _k === void 0 ? void 0 : _k.access_token)
                            ? "Connected to Gmail"
                            : 'Connect a separate Google account for Gmail triggers.'}
                    </p>
                  </div>
                  <button_1.Button size="sm" variant="secondary" onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_7;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, authenticateService('gmail')];
                                    case 1:
                                        _a.sent();
                                        setLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['Gmail trigger account connected successfully.'], false); });
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_7 = _a.sent();
                                        console.error('Gmail trigger authentication failed', error_7);
                                        setLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['Gmail trigger authentication failed.'], false); });
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }} className="mt-1">
                    {((_m = (_l = config.serviceTokens) === null || _l === void 0 ? void 0 : _l.gmail) === null || _m === void 0 ? void 0 : _m.access_token)
                            ? 'Reconnect Gmail'
                            : 'Connect Gmail'}
                  </button_1.Button>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  This connects to a separate Google account specifically for Gmail trigger access,
                  independent of your main login account.
                </p>
              </div>) : (commonInputs)}

            <div>
              <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Trigger Type
              </label_1.Label>
              <select_1.Select value={config.triggerType || 'polling'} onValueChange={function (value) { return updateNodeConfig(node.id, { triggerType: value }); }}>
                <select_1.SelectTrigger className="mt-1 w-full">
                  <select_1.SelectValue placeholder="Select trigger type"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="polling">Polling</select_1.SelectItem>
                  <select_1.SelectItem value="webhook">Webhook</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>

            <div>
              <VariableInput_1.VariableInput label="Query" fieldKey={"".concat(node.id, "-query")} value={config.query || ''} onChange={function (value) { return updateNodeConfig(node.id, { query: value }); }} placeholder="is:unread from:sales@example.com" className="mt-1" availableVariables={availableVariables}/>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Use Gmail search syntax to filter the trigger. Leave empty to monitor all messages.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Max Results
                </label_1.Label>
                <input_1.Input type="number" min="1" max="500" value={(_o = config.maxResults) !== null && _o !== void 0 ? _o : 20} onChange={function (e) { return updateNodeConfig(node.id, { maxResults: Number(e.target.value) }); }} className="mt-1"/>
              </div>
              <div>
                <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Check Interval (s)
                </label_1.Label>
                <input_1.Input type="number" min="10" max="3600" value={(_p = config.checkInterval) !== null && _p !== void 0 ? _p : 60} onChange={function (e) {
                        return updateNodeConfig(node.id, { checkInterval: Number(e.target.value) });
                    }} className="mt-1"/>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id={"includeBody-".concat(node.id)} checked={(_q = config.includeBody) !== null && _q !== void 0 ? _q : true} onChange={function (e) { return updateNodeConfig(node.id, { includeBody: e.target.checked }); }} className="rounded"/>
                <label_1.Label htmlFor={"includeBody-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Include Body
                </label_1.Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id={"markAsRead-".concat(node.id)} checked={(_r = config.markAsRead) !== null && _r !== void 0 ? _r : true} onChange={function (e) { return updateNodeConfig(node.id, { markAsRead: e.target.checked }); }} className="rounded"/>
                <label_1.Label htmlFor={"markAsRead-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Mark as Read
                </label_1.Label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input type="checkbox" id={"downloadAttachments-".concat(node.id)} checked={(_s = config.downloadAttachments) !== null && _s !== void 0 ? _s : false} onChange={function (e) {
                        return updateNodeConfig(node.id, { downloadAttachments: e.target.checked });
                    }} className="rounded"/>
                <label_1.Label htmlFor={"downloadAttachments-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Download Attachments
                </label_1.Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id={"retryOnError-".concat(node.id)} checked={(_t = config.retryOnError) !== null && _t !== void 0 ? _t : false} onChange={function (e) { return updateNodeConfig(node.id, { retryOnError: e.target.checked }); }} className="rounded"/>
                <label_1.Label htmlFor={"retryOnError-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Retry on Error
                </label_1.Label>
              </div>
            </div>

            {config.downloadAttachments && (<div>
                <VariableInput_1.VariableInput label="Attachment Path" fieldKey={"".concat(node.id, "-attachmentPath")} value={config.attachmentPath || ''} onChange={function (value) { return updateNodeConfig(node.id, { attachmentPath: value }); }} placeholder="./attachments" className="mt-1" availableVariables={availableVariables}/>
              </div>)}

            {config.retryOnError && (<div>
                <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Max Retries
                </label_1.Label>
                <input_1.Input type="number" min="0" max="10" value={(_u = config.maxRetries) !== null && _u !== void 0 ? _u : 3} onChange={function (e) { return updateNodeConfig(node.id, { maxRetries: Number(e.target.value) }); }} className="mt-1"/>
              </div>)}
          </div>);
            case 'trigger-google-sheets':
                return (<div className="space-y-4">
            {commonInputs}
            <div>
              <VariableInput_1.VariableInput label="Spreadsheet ID" fieldKey={"".concat(node.id, "-spreadsheetId")} value={config.spreadsheetId || ''} onChange={function (value) { return updateNodeConfig(node.id, { spreadsheetId: value }); }} placeholder="Enter Google Sheets spreadsheet ID" className="mt-1" availableVariables={availableVariables}/>
            </div>
            <div>
              <VariableInput_1.VariableInput label="Sheet Name" fieldKey={"".concat(node.id, "-sheetName")} value={config.sheetName || ''} onChange={function (value) { return updateNodeConfig(node.id, { sheetName: value }); }} placeholder="Sheet to monitor" className="mt-1" availableVariables={availableVariables}/>
            </div>
            <div>
              <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Trigger Type
              </label_1.Label>
              <select_1.Select value={config.triggerType || 'onNewRow'} onValueChange={function (value) { return updateNodeConfig(node.id, { triggerType: value }); }}>
                <select_1.SelectTrigger className="mt-1 w-full">
                  <select_1.SelectValue placeholder="Select trigger type"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="onNewRow">On New Row</select_1.SelectItem>
                  <select_1.SelectItem value="onRowChanged">On Row Changed</select_1.SelectItem>
                  <select_1.SelectItem value="onSheetChanged">On Sheet Changed</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            <div>
              <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Check Interval (seconds)
              </label_1.Label>
              <input_1.Input type="number" min="1" max="3600" value={config.checkInterval || 60} onChange={function (e) {
                        return updateNodeConfig(node.id, { checkInterval: parseInt(e.target.value) || 60 });
                    }} className="mt-1"/>
            </div>
            <div className="flex items-center space-x-2">
              <input type="checkbox" id={"useHeaderRow-trigger-".concat(node.id)} checked={(_v = config.useHeaderRow) !== null && _v !== void 0 ? _v : true} onChange={function (e) { return updateNodeConfig(node.id, { useHeaderRow: e.target.checked }); }} className="rounded"/>
              <label_1.Label htmlFor={"useHeaderRow-trigger-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Use first row as headers
              </label_1.Label>
            </div>
          </div>);
            case 'calendar-google':
                return (<div className="space-y-4">
            <div>
              <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Authentication Method
              </label_1.Label>
              <select_1.Select value={config.authMethod || 'manual'} onValueChange={function (value) { return updateNodeConfig(node.id, { authMethod: value }); }}>
                <select_1.SelectTrigger className="mt-1 w-full">
                  <select_1.SelectValue placeholder="Select authentication method"/>
                </select_1.SelectTrigger>
                <select_1.SelectContent>
                  <select_1.SelectItem value="google-oauth">Google OAuth</select_1.SelectItem>
                  <select_1.SelectItem value="manual">Manual / Saved Credential</select_1.SelectItem>
                </select_1.SelectContent>
              </select_1.Select>
            </div>
            {config.authMethod === 'google-oauth' ? (<div className="rounded-2xl border border-slate-200/70 bg-slate-50 p-4 text-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Google Calendar Account
                    </label_1.Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {((_x = (_w = config.serviceTokens) === null || _w === void 0 ? void 0 : _w.calendar) === null || _x === void 0 ? void 0 : _x.access_token)
                            ? "Connected to Google Calendar"
                            : 'Connect a separate Google account for Calendar access.'}
                    </p>
                  </div>
                  <button_1.Button size="sm" variant="secondary" onClick={function () { return __awaiter(_this, void 0, void 0, function () {
                            var error_8;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, authenticateService('calendar')];
                                    case 1:
                                        _a.sent();
                                        setLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                                            'Google Calendar account connected successfully.',
                                        ], false); });
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_8 = _a.sent();
                                        console.error('Google Calendar authentication failed', error_8);
                                        setLog(function (prev) { return __spreadArray(__spreadArray([], prev, true), ['Google Calendar authentication failed.'], false); });
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); }} className="mt-1">
                    {((_z = (_y = config.serviceTokens) === null || _y === void 0 ? void 0 : _y.calendar) === null || _z === void 0 ? void 0 : _z.access_token)
                            ? 'Reconnect Calendar'
                            : 'Connect Calendar'}
                  </button_1.Button>
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                  This connects to a separate Google account specifically for Google Calendar
                  access, independent of your main login account.
                </p>
              </div>) : (commonInputs)}
            <div>
              <VariableInput_1.VariableInput label="Calendar ID" fieldKey={"".concat(node.id, "-calendarId")} value={config.calendarId || ''} onChange={function (value) { return updateNodeConfig(node.id, { calendarId: value }); }} placeholder="primary or calendar email" className="mt-1" availableVariables={availableVariables}/>
            </div>
            <div>
              <VariableInput_1.VariableInput label="Event Summary" fieldKey={"".concat(node.id, "-summary")} value={config.summary || ''} onChange={function (value) { return updateNodeConfig(node.id, { summary: value }); }} placeholder="Meeting title" className="mt-1" availableVariables={availableVariables}/>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <VariableInput_1.VariableInput label="Start Time (ISO)" fieldKey={"".concat(node.id, "-startTime")} value={config.startTime || ''} onChange={function (value) { return updateNodeConfig(node.id, { startTime: value }); }} placeholder="2026-01-01T10:00:00Z" className="mt-1" availableVariables={availableVariables}/>
              </div>
              <div>
                <VariableInput_1.VariableInput label="End Time (ISO)" fieldKey={"".concat(node.id, "-endTime")} value={config.endTime || ''} onChange={function (value) { return updateNodeConfig(node.id, { endTime: value }); }} placeholder="2026-01-01T11:00:00Z" className="mt-1" availableVariables={availableVariables}/>
              </div>
            </div>
          </div>);
            case 'core-http-request':
                return (<div className="space-y-6">
            {/* Request Core Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Request Core
                </label_1.Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <VariableInput_1.VariableInput label="Base URL" fieldKey={"".concat(node.id, "-baseUrl")} value={config.baseUrl || ''} onChange={function (value) { return updateNodeConfig(node.id, { baseUrl: value }); }} placeholder="https://api.example.com" className="mt-1" availableVariables={availableVariables}/>
                </div>
                <div>
                  <VariableInput_1.VariableInput label="Path" fieldKey={"".concat(node.id, "-path")} value={config.path || ''} onChange={function (value) { return updateNodeConfig(node.id, { path: value }); }} placeholder="/v1/users" className="mt-1" availableVariables={availableVariables}/>
                </div>
              </div>
              <div>
                <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  HTTP Method
                </label_1.Label>
                <select_1.Select value={config.method || 'GET'} onValueChange={function (value) { return updateNodeConfig(node.id, { method: value }); }}>
                  <select_1.SelectTrigger className="mt-1 w-full">
                    <select_1.SelectValue placeholder="Select HTTP method"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(function (method) { return (<select_1.SelectItem key={method} value={method}>
                        {method}
                      </select_1.SelectItem>); })}
                  </select_1.SelectContent>
                </select_1.Select>
              </div>
            </div>

            {/* Authentication Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Authentication
                </label_1.Label>
              </div>
              <div>
                <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Auth Type
                </label_1.Label>
                <select_1.Select value={config.authType || 'none'} onValueChange={function (value) { return updateNodeConfig(node.id, { authType: value }); }}>
                  <select_1.SelectTrigger className="mt-1 w-full">
                    <select_1.SelectValue placeholder="Select authentication type"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="none">None</select_1.SelectItem>
                    <select_1.SelectItem value="basic">Basic Auth</select_1.SelectItem>
                    <select_1.SelectItem value="bearer">Bearer Token</select_1.SelectItem>
                    <select_1.SelectItem value="header">Custom Header</select_1.SelectItem>
                    <select_1.SelectItem value="oauth2">OAuth 2.0</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              {config.authType === 'basic' && (<div className="grid grid-cols-2 gap-3">
                  <div>
                    <VariableInput_1.VariableInput label="Username" fieldKey={"".concat(node.id, "-authConfig.username")} value={((_0 = config.authConfig) === null || _0 === void 0 ? void 0 : _0.username) || ''} onChange={function (value) {
                            return updateNodeConfig(node.id, {
                                authConfig: __assign(__assign({}, config.authConfig), { username: value }),
                            });
                        }} placeholder="Username" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Password
                    </label_1.Label>
                    <input_1.Input type="password" value={((_1 = config.authConfig) === null || _1 === void 0 ? void 0 : _1.password) || ''} onChange={function (e) {
                            return updateNodeConfig(node.id, {
                                authConfig: __assign(__assign({}, config.authConfig), { password: e.target.value }),
                            });
                        }} className="mt-1"/>
                  </div>
                </div>)}

              {config.authType === 'bearer' && (<div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Bearer Token
                  </label_1.Label>
                  <input_1.Input type="password" value={((_2 = config.authConfig) === null || _2 === void 0 ? void 0 : _2.token) || ''} onChange={function (e) {
                            return updateNodeConfig(node.id, {
                                authConfig: __assign(__assign({}, config.authConfig), { token: e.target.value }),
                            });
                        }} placeholder="your-bearer-token" className="mt-1"/>
                </div>)}

              {config.authType === 'header' && (<div className="grid grid-cols-2 gap-3">
                  <div>
                    <VariableInput_1.VariableInput label="Header Name" fieldKey={"".concat(node.id, "-authConfig.headerName")} value={((_3 = config.authConfig) === null || _3 === void 0 ? void 0 : _3.headerName) || ''} onChange={function (value) {
                            return updateNodeConfig(node.id, {
                                authConfig: __assign(__assign({}, config.authConfig), { headerName: value }),
                            });
                        }} placeholder="X-API-Key" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Header Value
                    </label_1.Label>
                    <input_1.Input type="password" value={((_4 = config.authConfig) === null || _4 === void 0 ? void 0 : _4.headerValue) || ''} onChange={function (e) {
                            return updateNodeConfig(node.id, {
                                authConfig: __assign(__assign({}, config.authConfig), { headerValue: e.target.value }),
                            });
                        }} className="mt-1"/>
                  </div>
                </div>)}
            </div>

            {/* Headers Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Headers
                </label_1.Label>
              </div>
              <div>
                <VariableTextarea_1.VariableTextarea label="Custom Headers (JSON)" fieldKey={"".concat(node.id, "-headers")} value={JSON.stringify(config.headers || {}, null, 2)} onChange={function (value) {
                        try {
                            var parsed = JSON.parse(value);
                            updateNodeConfig(node.id, { headers: parsed });
                        }
                        catch (_a) {
                            // ignore invalid JSON while typing
                        }
                    }} placeholder='{"Content-Type": "application/json", "Accept": "application/json"}' className="mt-1 h-24 font-mono text-xs" availableVariables={availableVariables}/>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id={"auto-headers-".concat(node.id)} checked={config.autoHeaders !== false} onChange={function (e) { return updateNodeConfig(node.id, { autoHeaders: e.target.checked }); }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                <label_1.Label htmlFor={"auto-headers-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Auto-generate headers (Accept, User-Agent)
                </label_1.Label>
              </div>
            </div>

            {/* Body Configuration Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Request Body
                </label_1.Label>
              </div>
              <div>
                <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Body Mode
                </label_1.Label>
                <select_1.Select value={config.bodyMode || 'json'} onValueChange={function (value) { return updateNodeConfig(node.id, { bodyMode: value }); }}>
                  <select_1.SelectTrigger className="mt-1 w-full">
                    <select_1.SelectValue placeholder="Select body mode"/>
                  </select_1.SelectTrigger>
                  <select_1.SelectContent>
                    <select_1.SelectItem value="json">JSON</select_1.SelectItem>
                    <select_1.SelectItem value="raw">Raw</select_1.SelectItem>
                    <select_1.SelectItem value="form-data">Form Data</select_1.SelectItem>
                    <select_1.SelectItem value="urlencoded">URL Encoded</select_1.SelectItem>
                    <select_1.SelectItem value="binary">Binary</select_1.SelectItem>
                    <select_1.SelectItem value="none">None</select_1.SelectItem>
                  </select_1.SelectContent>
                </select_1.Select>
              </div>

              {config.bodyMode === 'json' && (<div>
                  <VariableTextarea_1.VariableTextarea label="JSON Body" fieldKey={"".concat(node.id, "-bodyConfig.json")} value={JSON.stringify(((_5 = config.bodyConfig) === null || _5 === void 0 ? void 0 : _5.json) || {}, null, 2)} onChange={function (value) {
                            try {
                                var parsed = JSON.parse(value);
                                updateNodeConfig(node.id, {
                                    bodyConfig: __assign(__assign({}, config.bodyConfig), { json: parsed }),
                                });
                            }
                            catch (_a) {
                                // ignore invalid JSON while typing
                            }
                        }} placeholder='{"key": "value", "nested": {"data": true}}' className="mt-1 h-32 font-mono text-xs" availableVariables={availableVariables}/>
                </div>)}

              {config.bodyMode === 'raw' && (<div className="space-y-3">
                  <div>
                    <VariableTextarea_1.VariableTextarea label="Raw Content" fieldKey={"".concat(node.id, "-bodyConfig.raw.content")} value={((_7 = (_6 = config.bodyConfig) === null || _6 === void 0 ? void 0 : _6.raw) === null || _7 === void 0 ? void 0 : _7.content) || ''} onChange={function (value) {
                            var _a;
                            return updateNodeConfig(node.id, {
                                bodyConfig: __assign(__assign({}, config.bodyConfig), { raw: __assign(__assign({}, (_a = config.bodyConfig) === null || _a === void 0 ? void 0 : _a.raw), { content: value }) }),
                            });
                        }} placeholder="Plain text, XML, or other content" className="mt-1 h-24" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <VariableInput_1.VariableInput label="Content Type" fieldKey={"".concat(node.id, "-bodyConfig.raw.contentType")} value={((_9 = (_8 = config.bodyConfig) === null || _8 === void 0 ? void 0 : _8.raw) === null || _9 === void 0 ? void 0 : _9.contentType) || 'text/plain'} onChange={function (value) {
                            var _a;
                            return updateNodeConfig(node.id, {
                                bodyConfig: __assign(__assign({}, config.bodyConfig), { raw: __assign(__assign({}, (_a = config.bodyConfig) === null || _a === void 0 ? void 0 : _a.raw), { contentType: value }) }),
                            });
                        }} placeholder="text/plain" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                </div>)}

              {config.bodyMode === 'form-data' && (<div>
                  <VariableTextarea_1.VariableTextarea label="Form Data (JSON Array)" fieldKey={"".concat(node.id, "-bodyConfig.formData")} value={JSON.stringify(((_10 = config.bodyConfig) === null || _10 === void 0 ? void 0 : _10.formData) || [], null, 2)} onChange={function (value) {
                            try {
                                var parsed = JSON.parse(value);
                                updateNodeConfig(node.id, {
                                    bodyConfig: __assign(__assign({}, config.bodyConfig), { formData: parsed }),
                                });
                            }
                            catch (_a) {
                                // ignore invalid JSON while typing
                            }
                        }} placeholder='[{"key": "file", "value": "base64data", "type": "file", "filename": "test.jpg"}]' className="mt-1 h-32 font-mono text-xs" availableVariables={availableVariables}/>
                </div>)}

              {config.bodyMode === 'urlencoded' && (<div>
                  <VariableTextarea_1.VariableTextarea label="URL Encoded Data" fieldKey={"".concat(node.id, "-bodyConfig.urlencoded")} value={((_11 = config.bodyConfig) === null || _11 === void 0 ? void 0 : _11.urlencoded)
                            ? Object.entries(config.bodyConfig.urlencoded)
                                .map(function (_a) {
                                var k = _a[0], v = _a[1];
                                return "".concat(k, "=").concat(v);
                            })
                                .join('&')
                            : ''} onChange={function (value) {
                            var pairs = value.split('&').filter(Boolean);
                            var urlencoded = {};
                            pairs.forEach(function (pair) {
                                var _a = pair.split('='), key = _a[0], valueParts = _a.slice(1);
                                if (key)
                                    urlencoded[key] = valueParts.join('=');
                            });
                            updateNodeConfig(node.id, {
                                bodyConfig: __assign(__assign({}, config.bodyConfig), { urlencoded: urlencoded }),
                            });
                        }} placeholder="key1=value1&key2=value2" className="mt-1 h-24" availableVariables={availableVariables}/>
                </div>)}

              {config.bodyMode === 'binary' && (<div className="space-y-3">
                  <div>
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Binary Data (Base64)
                    </label_1.Label>
                    <VariableTextarea_1.VariableTextarea label="Binary Data (Base64)" fieldKey={"".concat(node.id, "-bodyConfig.binary.data")} value={((_13 = (_12 = config.bodyConfig) === null || _12 === void 0 ? void 0 : _12.binary) === null || _13 === void 0 ? void 0 : _13.data) || ''} onChange={function (value) {
                            var _a;
                            return updateNodeConfig(node.id, {
                                bodyConfig: __assign(__assign({}, config.bodyConfig), { binary: __assign(__assign({}, (_a = config.bodyConfig) === null || _a === void 0 ? void 0 : _a.binary), { data: value }) }),
                            });
                        }} placeholder="Base64 encoded binary data" className="mt-1 h-24 font-mono text-xs" availableVariables={availableVariables}/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Filename
                      </label_1.Label>
                      <VariableInput_1.VariableInput label="Filename" fieldKey={"".concat(node.id, "-bodyConfig.binary.filename")} value={((_15 = (_14 = config.bodyConfig) === null || _14 === void 0 ? void 0 : _14.binary) === null || _15 === void 0 ? void 0 : _15.filename) || ''} onChange={function (value) {
                            var _a;
                            return updateNodeConfig(node.id, {
                                bodyConfig: __assign(__assign({}, config.bodyConfig), { binary: __assign(__assign({}, (_a = config.bodyConfig) === null || _a === void 0 ? void 0 : _a.binary), { filename: value }) }),
                            });
                        }} placeholder="file.bin" className="mt-1" availableVariables={availableVariables}/>
                    </div>
                    <div>
                      <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Content Type
                      </label_1.Label>
                      <VariableInput_1.VariableInput label="Content Type" fieldKey={"".concat(node.id, "-bodyConfig.binary.contentType")} value={((_17 = (_16 = config.bodyConfig) === null || _16 === void 0 ? void 0 : _16.binary) === null || _17 === void 0 ? void 0 : _17.contentType) || ''} onChange={function (value) {
                            var _a;
                            return updateNodeConfig(node.id, {
                                bodyConfig: __assign(__assign({}, config.bodyConfig), { binary: __assign(__assign({}, (_a = config.bodyConfig) === null || _a === void 0 ? void 0 : _a.binary), { contentType: value }) }),
                            });
                        }} placeholder="application/octet-stream" className="mt-1" availableVariables={availableVariables}/>
                    </div>
                  </div>
                </div>)}
            </div>

            {/* Data Mapping Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Data Mapping (Expressions)
                </label_1.Label>
              </div>
              <div>
                <VariableInput_1.VariableInput label="URL Expression" fieldKey={"".concat(node.id, "-dataMapping.url")} value={((_18 = config.dataMapping) === null || _18 === void 0 ? void 0 : _18.url) || ''} onChange={function (value) {
                        return updateNodeConfig(node.id, {
                            dataMapping: __assign(__assign({}, config.dataMapping), { url: value }),
                        });
                    }} placeholder="{{baseUrl}}/users/{{userId}}" className="mt-1" availableVariables={availableVariables}/>
              </div>
              <div>
                <VariableTextarea_1.VariableTextarea label="Header Expressions (JSON)" fieldKey={"".concat(node.id, "-dataMapping.headers")} value={JSON.stringify(((_19 = config.dataMapping) === null || _19 === void 0 ? void 0 : _19.headers) || {}, null, 2)} onChange={function (value) {
                        try {
                            var parsed = JSON.parse(value);
                            updateNodeConfig(node.id, {
                                dataMapping: __assign(__assign({}, config.dataMapping), { headers: parsed }),
                            });
                        }
                        catch (_a) {
                            // ignore invalid JSON while typing
                        }
                    }} placeholder='{"Authorization": "Bearer {{token}}"}' className="mt-1 h-20 font-mono text-xs" availableVariables={availableVariables}/>
              </div>
              <div>
                <VariableTextarea_1.VariableTextarea label="Body Expression" fieldKey={"".concat(node.id, "-dataMapping.body")} value={((_20 = config.dataMapping) === null || _20 === void 0 ? void 0 : _20.body) ? JSON.stringify(config.dataMapping.body, null, 2) : ''} onChange={function (value) {
                        try {
                            var parsed = JSON.parse(value);
                            updateNodeConfig(node.id, {
                                dataMapping: __assign(__assign({}, config.dataMapping), { body: parsed }),
                            });
                        }
                        catch (_a) {
                            // ignore invalid JSON while typing
                        }
                    }} placeholder='{"user": "{{userData}}", "timestamp": "{{currentTime}}"}' className="mt-1 h-20 font-mono text-xs" availableVariables={availableVariables}/>
              </div>
              <div>
                <VariableTextarea_1.VariableTextarea label="Query Param Expressions (JSON)" fieldKey={"".concat(node.id, "-dataMapping.queryParams")} value={JSON.stringify(((_21 = config.dataMapping) === null || _21 === void 0 ? void 0 : _21.queryParams) || {}, null, 2)} onChange={function (value) {
                        try {
                            var parsed = JSON.parse(value);
                            updateNodeConfig(node.id, {
                                dataMapping: __assign(__assign({}, config.dataMapping), { queryParams: parsed }),
                            });
                        }
                        catch (_a) {
                            // ignore invalid JSON while typing
                        }
                    }} placeholder='{"limit": "{{pageSize}}", "offset": "{{pageOffset}}"}' className="mt-1 h-20 font-mono text-xs" availableVariables={availableVariables}/>
              </div>
            </div>

            {/* Response Handling Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Response Handling
                </label_1.Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Response Format
                  </label_1.Label>
                  <select_1.Select value={config.responseFormat || 'json'} onValueChange={function (value) { return updateNodeConfig(node.id, { responseFormat: value }); }}>
                    <select_1.SelectTrigger className="mt-1 w-full">
                      <select_1.SelectValue placeholder="Select format"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="json">JSON</select_1.SelectItem>
                      <select_1.SelectItem value="string">String</select_1.SelectItem>
                      <select_1.SelectItem value="binary">Binary</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
                <div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Response Mode
                  </label_1.Label>
                  <select_1.Select value={config.responseMode || 'full'} onValueChange={function (value) { return updateNodeConfig(node.id, { responseMode: value }); }}>
                    <select_1.SelectTrigger className="mt-1 w-full">
                      <select_1.SelectValue placeholder="Select mode"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="full">Full Response</select_1.SelectItem>
                      <select_1.SelectItem value="body-only">Body Only</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </div>
            </div>

            {/* Error Handling Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Error Handling
                </label_1.Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id={"continue-on-fail-".concat(node.id)} checked={config.continueOnFail || false} onChange={function (e) { return updateNodeConfig(node.id, { continueOnFail: e.target.checked }); }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                <label_1.Label htmlFor={"continue-on-fail-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Continue on failure (don't stop workflow)
                </label_1.Label>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Retry Count
                  </label_1.Label>
                  <input_1.Input type="number" min="0" max="10" value={(_22 = config.retryCount) !== null && _22 !== void 0 ? _22 : 0} onChange={function (e) {
                        return updateNodeConfig(node.id, { retryCount: Number(e.target.value) });
                    }} className="mt-1"/>
                </div>
                <div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Retry Delay (ms)
                  </label_1.Label>
                  <input_1.Input type="number" min="100" max="60000" value={(_23 = config.retryDelay) !== null && _23 !== void 0 ? _23 : 1000} onChange={function (e) {
                        return updateNodeConfig(node.id, { retryDelay: Number(e.target.value) });
                    }} className="mt-1"/>
                </div>
                <div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Retry Condition
                  </label_1.Label>
                  <select_1.Select value={config.retryCondition || 'always'} onValueChange={function (value) { return updateNodeConfig(node.id, { retryCondition: value }); }}>
                    <select_1.SelectTrigger className="mt-1 w-full">
                      <select_1.SelectValue placeholder="When to retry"/>
                    </select_1.SelectTrigger>
                    <select_1.SelectContent>
                      <select_1.SelectItem value="always">Always</select_1.SelectItem>
                      <select_1.SelectItem value="5xx">5xx Errors</select_1.SelectItem>
                      <select_1.SelectItem value="network">Network Errors</select_1.SelectItem>
                      <select_1.SelectItem value="timeout">Timeout</select_1.SelectItem>
                    </select_1.SelectContent>
                  </select_1.Select>
                </div>
              </div>
              <div>
                <VariableTextarea_1.VariableTextarea label="Fail Conditions (JSON Array)" fieldKey={"".concat(node.id, "-failConditions")} value={JSON.stringify(config.failConditions || [], null, 2)} onChange={function (value) {
                        try {
                            var parsed = JSON.parse(value);
                            updateNodeConfig(node.id, { failConditions: parsed });
                        }
                        catch (_a) {
                            // ignore invalid JSON while typing
                        }
                    }} placeholder='[{"condition": "status", "value": "404"}, {"condition": "contains", "value": "error"}]' className="mt-1 h-20 font-mono text-xs" availableVariables={availableVariables}/>
              </div>
            </div>

            {/* Pagination Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Pagination
                </label_1.Label>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id={"pagination-enabled-".concat(node.id)} checked={((_24 = config.pagination) === null || _24 === void 0 ? void 0 : _24.enabled) || false} onChange={function (e) {
                        return updateNodeConfig(node.id, {
                            pagination: __assign(__assign({}, config.pagination), { enabled: e.target.checked }),
                        });
                    }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                <label_1.Label htmlFor={"pagination-enabled-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Enable pagination
                </label_1.Label>
              </div>

              {((_25 = config.pagination) === null || _25 === void 0 ? void 0 : _25.enabled) && (<>
                  <div>
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Pagination Type
                    </label_1.Label>
                    <select_1.Select value={((_26 = config.pagination) === null || _26 === void 0 ? void 0 : _26.type) || 'offset'} onValueChange={function (value) {
                            return updateNodeConfig(node.id, {
                                pagination: __assign(__assign({}, config.pagination), { type: value }),
                            });
                        }}>
                      <select_1.SelectTrigger className="mt-1 w-full">
                        <select_1.SelectValue placeholder="Select pagination type"/>
                      </select_1.SelectTrigger>
                      <select_1.SelectContent>
                        <select_1.SelectItem value="offset">Offset-based</select_1.SelectItem>
                        <select_1.SelectItem value="cursor">Cursor-based</select_1.SelectItem>
                        <select_1.SelectItem value="page">Page-based</select_1.SelectItem>
                        <select_1.SelectItem value="link">Link-based</select_1.SelectItem>
                      </select_1.SelectContent>
                    </select_1.Select>
                  </div>

                  {(((_27 = config.pagination) === null || _27 === void 0 ? void 0 : _27.type) === 'offset' || ((_28 = config.pagination) === null || _28 === void 0 ? void 0 : _28.type) === 'page') && (<div className="grid grid-cols-2 gap-3">
                      <div>
                        <VariableInput_1.VariableInput label={((_29 = config.pagination) === null || _29 === void 0 ? void 0 : _29.type) === 'offset' ? 'Offset Param' : 'Page Param'} fieldKey={"".concat(node.id, "-pagination.config.").concat(config.pagination.type === 'offset' ? 'offsetParam' : 'pageParam')} value={((_31 = (_30 = config.pagination) === null || _30 === void 0 ? void 0 : _30.config) === null || _31 === void 0 ? void 0 : _31[config.pagination.type === 'offset' ? 'offsetParam' : 'pageParam']) || (config.pagination.type === 'offset' ? 'offset' : 'page')} onChange={function (value) {
                                var _a;
                                return updateNodeConfig(node.id, {
                                    pagination: __assign(__assign({}, config.pagination), { config: __assign(__assign({}, config.pagination.config), (_a = {}, _a[config.pagination.type === 'offset'
                                            ? 'offsetParam'
                                            : 'pageParam'] = value, _a)) }),
                                });
                            }} className="mt-1" availableVariables={availableVariables}/>
                      </div>
                      <div>
                        <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          Limit Param
                        </label_1.Label>
                        <VariableInput_1.VariableInput label="Limit Param" fieldKey={"".concat(node.id, "-pagination.config.limitParam")} value={((_33 = (_32 = config.pagination) === null || _32 === void 0 ? void 0 : _32.config) === null || _33 === void 0 ? void 0 : _33.limitParam) || 'limit'} onChange={function (value) {
                                return updateNodeConfig(node.id, {
                                    pagination: __assign(__assign({}, config.pagination), { config: __assign(__assign({}, config.pagination.config), { limitParam: value }) }),
                                });
                            }} className="mt-1" availableVariables={availableVariables}/>
                      </div>
                    </div>)}

                  {((_34 = config.pagination) === null || _34 === void 0 ? void 0 : _34.type) === 'cursor' && (<div>
                      <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Cursor Param
                      </label_1.Label>
                      <VariableInput_1.VariableInput label="Cursor Param" fieldKey={"".concat(node.id, "-pagination.config.cursorParam")} value={((_36 = (_35 = config.pagination) === null || _35 === void 0 ? void 0 : _35.config) === null || _36 === void 0 ? void 0 : _36.cursorParam) || 'cursor'} onChange={function (value) {
                                return updateNodeConfig(node.id, {
                                    pagination: __assign(__assign({}, config.pagination), { config: __assign(__assign({}, config.pagination.config), { cursorParam: value }) }),
                                });
                            }} className="mt-1" availableVariables={availableVariables}/>
                    </div>)}

                  {((_37 = config.pagination) === null || _37 === void 0 ? void 0 : _37.type) === 'link' && (<div>
                      <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Next Link Path
                      </label_1.Label>
                      <VariableInput_1.VariableInput label="Next Link Path" fieldKey={"".concat(node.id, "-pagination.config.nextLinkPath")} value={((_39 = (_38 = config.pagination) === null || _38 === void 0 ? void 0 : _38.config) === null || _39 === void 0 ? void 0 : _39.nextLinkPath) || 'next'} onChange={function (value) {
                                return updateNodeConfig(node.id, {
                                    pagination: __assign(__assign({}, config.pagination), { config: __assign(__assign({}, config.pagination.config), { nextLinkPath: value }) }),
                                });
                            }} placeholder="next" className="mt-1" availableVariables={availableVariables}/>
                    </div>)}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Has Next Path
                      </label_1.Label>
                      <VariableInput_1.VariableInput label="Has Next Path" fieldKey={"".concat(node.id, "-pagination.config.hasNextPath")} value={((_41 = (_40 = config.pagination) === null || _40 === void 0 ? void 0 : _40.config) === null || _41 === void 0 ? void 0 : _41.hasNextPath) || 'hasNext'} onChange={function (value) {
                            return updateNodeConfig(node.id, {
                                pagination: __assign(__assign({}, config.pagination), { config: __assign(__assign({}, config.pagination.config), { hasNextPath: value }) }),
                            });
                        }} className="mt-1" availableVariables={availableVariables}/>
                    </div>
                    <div>
                      <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Max Pages
                      </label_1.Label>
                      <input_1.Input type="number" min="1" max="1000" value={(_44 = (_43 = (_42 = config.pagination) === null || _42 === void 0 ? void 0 : _42.config) === null || _43 === void 0 ? void 0 : _43.maxPages) !== null && _44 !== void 0 ? _44 : 100} onChange={function (e) {
                            return updateNodeConfig(node.id, {
                                pagination: __assign(__assign({}, config.pagination), { config: __assign(__assign({}, config.pagination.config), { maxPages: Number(e.target.value) }) }),
                            });
                        }} className="mt-1"/>
                    </div>
                  </div>
                </>)}
            </div>

            {/* Networking Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Networking
                </label_1.Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Timeout (ms)
                  </label_1.Label>
                  <input_1.Input type="number" min="1000" max="300000" value={(_45 = config.timeout) !== null && _45 !== void 0 ? _45 : 30000} onChange={function (e) { return updateNodeConfig(node.id, { timeout: Number(e.target.value) }); }} className="mt-1"/>
                </div>
                <div>
                  <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Max Redirects
                  </label_1.Label>
                  <input_1.Input type="number" min="0" max="10" value={(_46 = config.maxRedirects) !== null && _46 !== void 0 ? _46 : 5} onChange={function (e) {
                        return updateNodeConfig(node.id, { maxRedirects: Number(e.target.value) });
                    }} className="mt-1"/>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" id={"follow-redirects-".concat(node.id)} checked={config.followRedirects !== false} onChange={function (e) { return updateNodeConfig(node.id, { followRedirects: e.target.checked }); }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                <label_1.Label htmlFor={"follow-redirects-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Follow redirects
                </label_1.Label>
              </div>

              {/* Proxy Configuration */}
              <div className="space-y-3">
                <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Proxy Configuration
                </label_1.Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <VariableInput_1.VariableInput label="Proxy Host" fieldKey={"".concat(node.id, "-proxy.host")} value={((_47 = config.proxy) === null || _47 === void 0 ? void 0 : _47.host) || ''} onChange={function (value) {
                        return updateNodeConfig(node.id, {
                            proxy: __assign(__assign({}, config.proxy), { host: value }),
                        });
                    }} placeholder="proxy.example.com" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <input_1.Input type="number" min="1" max="65535" value={((_48 = config.proxy) === null || _48 === void 0 ? void 0 : _48.port) || 8080} onChange={function (e) {
                        return updateNodeConfig(node.id, {
                            proxy: __assign(__assign({}, config.proxy), { port: Number(e.target.value) }),
                        });
                    }} placeholder="8080" className="mt-1"/>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <VariableInput_1.VariableInput label="Proxy Username" fieldKey={"".concat(node.id, "-proxy.auth.username")} value={((_50 = (_49 = config.proxy) === null || _49 === void 0 ? void 0 : _49.auth) === null || _50 === void 0 ? void 0 : _50.username) || ''} onChange={function (value) {
                        var _a;
                        return updateNodeConfig(node.id, {
                            proxy: __assign(__assign({}, config.proxy), { auth: __assign(__assign({}, (_a = config.proxy) === null || _a === void 0 ? void 0 : _a.auth), { username: value }) }),
                        });
                    }} placeholder="Proxy username" className="mt-1" availableVariables={availableVariables}/>
                  </div>
                  <div>
                    <input_1.Input type="password" value={((_52 = (_51 = config.proxy) === null || _51 === void 0 ? void 0 : _51.auth) === null || _52 === void 0 ? void 0 : _52.password) || ''} onChange={function (e) {
                        var _a;
                        return updateNodeConfig(node.id, {
                            proxy: __assign(__assign({}, config.proxy), { auth: __assign(__assign({}, (_a = config.proxy) === null || _a === void 0 ? void 0 : _a.auth), { password: e.target.value }) }),
                        });
                    }} placeholder="Proxy password" className="mt-1"/>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id={"ssl-ignore-".concat(node.id)} checked={config.sslIgnore || false} onChange={function (e) { return updateNodeConfig(node.id, { sslIgnore: e.target.checked }); }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                <label_1.Label htmlFor={"ssl-ignore-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Ignore SSL certificate errors
                </label_1.Label>
              </div>
            </div>

            {/* Execution Options Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <label_1.Label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Execution Options
                </label_1.Label>
              </div>

              {/* Batching */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id={"batching-enabled-".concat(node.id)} checked={((_53 = config.batching) === null || _53 === void 0 ? void 0 : _53.enabled) || false} onChange={function (e) {
                        return updateNodeConfig(node.id, {
                            batching: __assign(__assign({}, config.batching), { enabled: e.target.checked }),
                        });
                    }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                  <label_1.Label htmlFor={"batching-enabled-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Enable batching
                  </label_1.Label>
                </div>
                {((_54 = config.batching) === null || _54 === void 0 ? void 0 : _54.enabled) && (<div className="grid grid-cols-2 gap-3 ml-6">
                    <div>
                      <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Batch Size
                      </label_1.Label>
                      <input_1.Input type="number" min="1" max="100" value={(_56 = (_55 = config.batching) === null || _55 === void 0 ? void 0 : _55.size) !== null && _56 !== void 0 ? _56 : 10} onChange={function (e) {
                            return updateNodeConfig(node.id, {
                                batching: __assign(__assign({}, config.batching), { size: Number(e.target.value) }),
                            });
                        }} className="mt-1"/>
                    </div>
                    <div>
                      <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Batch Delay (ms)
                      </label_1.Label>
                      <input_1.Input type="number" min="0" max="10000" value={(_58 = (_57 = config.batching) === null || _57 === void 0 ? void 0 : _57.delay) !== null && _58 !== void 0 ? _58 : 0} onChange={function (e) {
                            return updateNodeConfig(node.id, {
                                batching: __assign(__assign({}, config.batching), { delay: Number(e.target.value) }),
                            });
                        }} className="mt-1"/>
                    </div>
                  </div>)}
              </div>

              {/* Rate Limiting */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id={"rate-limit-enabled-".concat(node.id)} checked={((_59 = config.rateLimit) === null || _59 === void 0 ? void 0 : _59.enabled) || false} onChange={function (e) {
                        return updateNodeConfig(node.id, {
                            rateLimit: __assign(__assign({}, config.rateLimit), { enabled: e.target.checked }),
                        });
                    }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                  <label_1.Label htmlFor={"rate-limit-enabled-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Enable rate limiting
                  </label_1.Label>
                </div>
                {((_60 = config.rateLimit) === null || _60 === void 0 ? void 0 : _60.enabled) && (<div className="ml-6">
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Rate Limit (requests per minute)
                    </label_1.Label>
                    <input_1.Input type="number" min="1" max="1000" value={(_62 = (_61 = config.rateLimit) === null || _61 === void 0 ? void 0 : _61.requests) !== null && _62 !== void 0 ? _62 : 10} onChange={function (e) {
                            return updateNodeConfig(node.id, {
                                rateLimit: __assign(__assign({}, config.rateLimit), { requests: Number(e.target.value) }),
                            });
                        }} className="mt-1"/>
                  </div>)}
              </div>

              {/* Concurrency */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id={"concurrency-enabled-".concat(node.id)} checked={((_63 = config.concurrency) === null || _63 === void 0 ? void 0 : _63.enabled) || false} onChange={function (e) {
                        return updateNodeConfig(node.id, {
                            concurrency: __assign(__assign({}, config.concurrency), { enabled: e.target.checked }),
                        });
                    }} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"/>
                  <label_1.Label htmlFor={"concurrency-enabled-".concat(node.id)} className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Enable concurrency control
                  </label_1.Label>
                </div>
                {((_64 = config.concurrency) === null || _64 === void 0 ? void 0 : _64.enabled) && (<div className="ml-6">
                    <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      Max Concurrency
                    </label_1.Label>
                    <input_1.Input type="number" min="1" max="50" value={(_66 = (_65 = config.concurrency) === null || _65 === void 0 ? void 0 : _65.limit) !== null && _66 !== void 0 ? _66 : 5} onChange={function (e) {
                            return updateNodeConfig(node.id, {
                                concurrency: __assign(__assign({}, config.concurrency), { limit: Number(e.target.value) }),
                            });
                        }} className="mt-1"/>
                  </div>)}
              </div>
            </div>
          </div>);
            default: {
                var genericConfigComponent = renderGenericNodeConfig(node);
                if (genericConfigComponent) {
                    return genericConfigComponent;
                }
                return (<div className="space-y-4">
            <div>
              <VariableTextarea_1.VariableTextarea label="Custom JSON Config" fieldKey={"".concat(node.id, "-customConfig")} value={JSON.stringify(config, null, 2)} onChange={function (value) {
                        try {
                            var parsed = JSON.parse(value);
                            updateNodeConfig(node.id, parsed);
                        }
                        catch (_a) {
                            // ignore invalid JSON while typing
                        }
                    }} className="mt-1 h-40 font-mono" availableVariables={availableVariables}/>
            </div>
          </div>);
            }
        }
    };
    return (<>
      {activeSection === 'builder' && showNodePalette && (<aside className="fixed z-50 h-[calc(100%-5rem)] w-96 max-w-[28rem] overflow-y-auto rounded-2xl border border-blue-300/50 bg-white/95 p-6 shadow-2xl backdrop-blur-xl dark:border-blue-500/30 dark:bg-slate-900/95" style={{ left: nodePalettePosition.x, top: nodePalettePosition.y }}>
          <div className="mb-6 flex cursor-grab items-center justify-between rounded-xl p-3 hover:bg-blue-50/40 dark:hover:bg-slate-800/50 bg-gradient-to-r from-blue-50/30 to-indigo-50/30 dark:from-slate-800/30 dark:to-slate-700/30" onMouseDown={function (event) {
                event.preventDefault();
                setDraggingPane('palette');
                setDragOffset({
                    x: event.clientX - nodePalettePosition.x,
                    y: event.clientY - nodePalettePosition.y,
                });
            }} onMouseUp={function () { return setDraggingPane(null); }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <lucide_react_1.Zap className="w-4 h-4 text-white"/>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Node Palette
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Drag nodes to build your workflow
                </p>
              </div>
            </div>
            <button onClick={function () { return setShowNodePalette(false); }} className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors duration-200">
              ✕
            </button>
          </div>

          <div className="mb-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M21 21l-4.35-4.35"/>
                  <circle cx="10" cy="10" r="6"/>
                </svg>
              </div>
              <input type="text" placeholder="Search nodes..." value={searchQuery} onChange={function (e) { return setSearchQuery(e.target.value); }} className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200/60 bg-gradient-to-r from-white/90 to-slate-50/80 text-slate-800 placeholder-slate-400 focus:border-blue-400/80 focus:bg-white/95 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-300 dark:border-slate-700/60 dark:bg-gradient-to-r dark:from-slate-900/90 dark:to-slate-800/80 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-blue-500/80 dark:focus:bg-slate-900/95 dark:focus:ring-blue-500/20 backdrop-blur-sm shadow-sm focus:shadow-lg"/>
            </div>
          </div>

          <div className="space-y-4">
            {Object.entries(groupedNodeTypes).map(function (_a) {
                var category = _a[0], categoryNodes = _a[1];
                return (<section key={category} className="rounded-2xl bg-gradient-to-br from-white/90 via-slate-50/80 to-blue-50/40 p-5 dark:from-slate-800/90 dark:via-slate-700/80 dark:to-slate-600/40 border border-slate-200/50 dark:border-slate-600/50 shadow-sm hover:shadow-md transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-sm"></div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {category}
                  </h4>
                  <div className="ml-auto px-2 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-700/60 rounded-full border border-slate-200/40 dark:border-slate-600/40">
                    {categoryNodes.length}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {categoryNodes
                        .filter(function (node) {
                        return node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            node.id.toLowerCase().includes(searchQuery.toLowerCase());
                    })
                        .map(function (node) { return (<button key={node.id} onClick={function () {
                            var newNode = {
                                id: "".concat(nodes.length + 1),
                                type: node.id,
                                position: {
                                    x: Math.random() * 400 + 100,
                                    y: Math.random() * 300 + 100,
                                },
                                data: {
                                    label: node.label,
                                    config: {},
                                    icon: node.icon,
                                },
                            };
                            setNodes(__spreadArray(__spreadArray([], nodes, true), [newNode], false));
                        }} className="group w-full rounded-xl border border-slate-200/60 bg-gradient-to-r from-white/80 to-slate-50/60 p-4 text-left text-sm text-slate-800 transition-all duration-300 hover:border-blue-400/70 hover:bg-gradient-to-r hover:from-blue-50/90 hover:to-indigo-50/80 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-0.5 dark:border-slate-700/60 dark:bg-gradient-to-r dark:from-slate-900/80 dark:to-slate-800/60 dark:text-slate-100 dark:hover:border-blue-500/70 dark:hover:from-blue-950/90 dark:hover:to-indigo-950/80 flex items-center gap-4 backdrop-blur-sm">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 dark:from-slate-700 dark:via-slate-600 dark:to-slate-500 flex items-center justify-center shadow-md group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 border border-white/50 dark:border-slate-600/50">
                          {renderIcon(node.icon, 'w-10 h-10 text-blue-700 dark:text-blue-300 drop-shadow-sm')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-900 dark:text-slate-100 truncate text-base group-hover:text-blue-900 dark:group-hover:text-blue-100 transition-colors duration-200">
                            {node.label}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium uppercase tracking-wide">
                            {node.category}
                          </div>
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <lucide_react_1.Plus className="w-4 h-4 text-white"/>
                          </div>
                        </div>
                      </button>); })}
                </div>
              </section>);
            })}
          </div>
        </aside>)}

      {activeSection === 'settings' && (<aside className="fixed z-50 h-[calc(100%-5rem)] w-96 max-w-[28rem] overflow-y-auto rounded-2xl border border-blue-300/50 bg-white/90 p-4 shadow-2xl backdrop-blur-xl dark:border-blue-500/30 dark:bg-slate-900/90" style={{ left: settingsPosition.x, top: settingsPosition.y }}>
          <div className="mb-4 flex cursor-grab items-center justify-between rounded-lg p-2 hover:bg-blue-50/40 dark:hover:bg-slate-800/50" onMouseDown={function (event) {
                event.preventDefault();
                setDraggingPane('settings');
                setDragOffset({
                    x: event.clientX - settingsPosition.x,
                    y: event.clientY - settingsPosition.y,
                });
            }} onMouseUp={function () { return setDraggingPane(null); }}>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Settings</h3>
            <button onClick={function () { return setActiveSection('builder'); }} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700">
              Close
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label_1.Label htmlFor="openai-key" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                OpenAI API Key
              </label_1.Label>
              <input_1.Input id="openai-key" type="password" value={apiKeys.openai} onChange={function (e) { return setApiKeys(__assign(__assign({}, apiKeys), { openai: e.target.value })); }} className="mt-1"/>
            </div>
            <div>
              <label_1.Label htmlFor="gemini-key" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Gemini API Key
              </label_1.Label>
              <input_1.Input id="gemini-key" type="password" value={apiKeys.gemini} onChange={function (e) { return setApiKeys(__assign(__assign({}, apiKeys), { gemini: e.target.value })); }} className="mt-1"/>
            </div>
            <div>
              <label_1.Label htmlFor="deepseek-key" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                DeepSeek API Key
              </label_1.Label>
              <input_1.Input id="deepseek-key" type="password" value={apiKeys.deepseek} onChange={function (e) { return setApiKeys(__assign(__assign({}, apiKeys), { deepseek: e.target.value })); }} className="mt-1"/>
            </div>
            <div>
              <label_1.Label htmlFor="gmail-key" className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Gmail API Key
              </label_1.Label>
              <input_1.Input id="gmail-key" type="password" value={apiKeys.gmail} onChange={function (e) { return setApiKeys(__assign(__assign({}, apiKeys), { gmail: e.target.value })); }} className="mt-1"/>
            </div>

            <button_1.Button size="sm" onClick={saveApiKeys} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              Save Keys
            </button_1.Button>
          </div>
        </aside>)}

      {selectedNode && (<>
          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={function () { return selectNode(undefined); }}/>
          <aside className="fixed z-50 h-[calc(100%-5rem)] w-96 max-w-[28rem] rounded-2xl border border-purple-300/50 bg-white/95 p-4 shadow-2xl backdrop-blur-xl dark:border-purple-500/30 dark:bg-slate-900/95" style={{ left: nodeConfigPosition.x, top: nodeConfigPosition.y, overflow: 'visible' }}>
            <div className="mb-4 flex cursor-grab items-center justify-between rounded-lg p-2 hover:bg-purple-50/40 dark:hover:bg-purple-900/20" onMouseDown={function (event) {
                event.preventDefault();
                setDraggingPane('nodeConfig');
                setDragOffset({
                    x: event.clientX - nodeConfigPosition.x,
                    y: event.clientY - nodeConfigPosition.y,
                });
            }} onMouseUp={function () { return setDraggingPane(null); }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Node Configuration
                </h3>
              </div>
              <button onClick={function () { return selectNode(undefined); }} className="rounded-md px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 transition-all duration-200">
                ✕
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[calc(100%-60px)] pr-2">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-4 border border-purple-200/50 dark:border-purple-700/50">
                <label_1.Label htmlFor="node-label" className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                  Node Label
                </label_1.Label>
                <input_1.Input id="node-label" value={((_f = selectedNode.data) === null || _f === void 0 ? void 0 : _f.label) || ''} onChange={function (e) {
                setNodes(nodes.map(function (n) {
                    return n.id === selectedNodeId
                        ? __assign(__assign({}, n), { data: __assign(__assign({}, n.data), { label: e.target.value }) }) : n;
                }));
            }} className="w-full bg-white/80 dark:bg-slate-800/80 border-purple-300 dark:border-purple-600 focus:border-purple-500 focus:ring-purple-500 transition-all duration-200" placeholder="Enter node label..."/>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/50">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <badge_1.Badge className="bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-100">
                        {nodeTypeCategory(selectedNode.type || '')}
                      </badge_1.Badge>
                      <span className={"text-xs font-semibold ".concat(isNodeConfigured(selectedNode) ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                        {isNodeConfigured(selectedNode) ? 'Configured' : 'Missing required values'}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {selectedNode.data.label}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={"w-3 h-3 rounded-full ".concat(isNodeConfigured(selectedNode) ? 'bg-emerald-500' : 'bg-rose-500')}/>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {selectedNode.type}
                    </span>
                  </div>
                </div>
                {renderNodeConfigForm(selectedNode)}
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200/50 dark:border-green-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Node Info
                  </span>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div>
                    <strong>ID:</strong> {selectedNode.id}
                  </div>
                  <div>
                    <strong>Type:</strong> {selectedNode.type}
                  </div>
                  <div>
                    <strong>Position:</strong> ({Math.round((_h = (_g = selectedNode.position) === null || _g === void 0 ? void 0 : _g.x) !== null && _h !== void 0 ? _h : 0)},{' '}
                    {Math.round((_k = (_j = selectedNode.position) === null || _j === void 0 ? void 0 : _j.y) !== null && _k !== void 0 ? _k : 0)})
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </>)}

      {contextMenu.type && (<div className="fixed z-50 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 rounded-2xl shadow-2xl p-2 min-w-56" style={{ left: contextMenu.x, top: contextMenu.y }} onMouseLeave={function () { return setContextMenu({ type: null, x: 0, y: 0 }); }}>
          {contextMenu.type === 'node' && (<>
              <div className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200/50 dark:border-slate-700/50 mb-1">
                Node Actions
              </div>
              <button className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50/70 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3" onClick={function () {
                    if (contextMenu.id)
                        duplicateNode(contextMenu.id);
                    setContextMenu({ type: null, x: 0, y: 0 });
                }}>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Duplicate Node</span>
              </button>
              <button className="w-full text-left px-3 py-3 text-sm hover:bg-slate-50/70 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3" onClick={function () {
                    var _a;
                    if ((_a = contextMenu.data) === null || _a === void 0 ? void 0 : _a.config)
                        copyConfig(contextMenu.data.config);
                    setContextMenu({ type: null, x: 0, y: 0 });
                }}>
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span>Copy Config</span>
              </button>
              <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-2"></div>
              <button className="w-full text-left px-3 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3" onClick={function () {
                    if (contextMenu.id) {
                        setNodes(nodes.filter(function (n) { return n.id !== contextMenu.id; }));
                    }
                    setContextMenu({ type: null, x: 0, y: 0 });
                }}>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Delete Node</span>
              </button>
            </>)}
          {contextMenu.type === 'edge' && (<>
              <div className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200/50 dark:border-slate-700/50 mb-1">
                Edge Actions
              </div>
              <button className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50/70 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3" onClick={function () {
                    if (contextMenu.id)
                        duplicateEdge(contextMenu.id);
                    setContextMenu({ type: null, x: 0, y: 0 });
                }}>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Duplicate Edge</span>
              </button>
              <div className="border-t border-slate-200/50 dark:border-slate-700/50 my-2"></div>
              <button className="w-full text-left px-3 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3" onClick={function () {
                    if (contextMenu.id) {
                        setEdges(edges.filter(function (e) { return e.id !== contextMenu.id; }));
                    }
                    setContextMenu({ type: null, x: 0, y: 0 });
                }}>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span>Delete Edge</span>
              </button>
            </>)}
          {contextMenu.type === 'canvas' && (<>
              <div className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide border-b border-slate-200/50 dark:border-slate-700/50 mb-1">
                Canvas Actions
              </div>
              <button className="w-full text-left px-3 py-3 text-sm hover:bg-slate-50/70 dark:hover:bg-slate-700/50 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3" onClick={function () {
                    setNodes([]);
                    setEdges([]);
                    setContextMenu({ type: null, x: 0, y: 0 });
                }}>
                <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                <span>Clear Canvas</span>
              </button>
              <button className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50/70 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3" onClick={function () {
                    /* undo not available in this component */
                }}>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Undo</span>
              </button>
              <button className="w-full text-left px-3 py-3 text-sm hover:bg-blue-50/70 dark:hover:bg-blue-900/20 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-3" onClick={function () {
                    /* redo not available in this component */
                }}>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Redo</span>
              </button>
            </>)}
        </div>)}
    </>);
}
