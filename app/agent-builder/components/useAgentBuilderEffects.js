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
exports.useAgentBuilderAutosave = useAgentBuilderAutosave;
exports.useAgentBuilderHistory = useAgentBuilderHistory;
exports.useAgentBuilderKeyboardShortcuts = useAgentBuilderKeyboardShortcuts;
exports.useAgentBuilderDragPanels = useAgentBuilderDragPanels;
exports.useAgentBuilderSocketExecution = useAgentBuilderSocketExecution;
exports.useAgentBuilderExecutionStateSync = useAgentBuilderExecutionStateSync;
exports.useAgentBuilderDataLoader = useAgentBuilderDataLoader;
exports.useAgentBuilderExecutionPoller = useAgentBuilderExecutionPoller;
exports.useAgentBuilderEffects = useAgentBuilderEffects;
var react_1 = require("react");
var socket_client_1 = require("@/lib/socket-client");
var supabaseClient_1 = require("@/lib/supabaseClient");
function useAgentBuilderAutosave(_a) {
    var nodes = _a.nodes, edges = _a.edges, workflowName = _a.workflowName, agentDescription = _a.agentDescription, selectedAgentId = _a.selectedAgentId, currentAgentStatus = _a.currentAgentStatus;
    (0, react_1.useEffect)(function () {
        var saveTimer = window.setTimeout(function () {
            try {
                localStorage.setItem('agent-builder-workflow', JSON.stringify({
                    nodes: nodes,
                    edges: edges,
                    name: workflowName,
                    description: agentDescription,
                    selectedAgentId: selectedAgentId,
                    currentAgentStatus: currentAgentStatus,
                }));
            }
            catch (error) {
                console.error('Failed to autosave builder state', error);
            }
        }, 500);
        return function () { return window.clearTimeout(saveTimer); };
    }, [nodes, edges, workflowName, agentDescription, selectedAgentId, currentAgentStatus]);
}
function useAgentBuilderHistory(_a) {
    var nodes = _a.nodes, edges = _a.edges, setNodes = _a.setNodes, setEdges = _a.setEdges;
    var historyRef = (0, react_1.useRef)([]);
    var futureRef = (0, react_1.useRef)([]);
    var isTimeTravelRef = (0, react_1.useRef)(false);
    (0, react_1.useEffect)(function () {
        if (isTimeTravelRef.current) {
            isTimeTravelRef.current = false;
            return;
        }
        historyRef.current = __spreadArray(__spreadArray([], historyRef.current.slice(-49), true), [{ nodes: nodes, edges: edges }], false);
        futureRef.current = [];
    }, [nodes, edges]);
    var undo = function () {
        if (historyRef.current.length < 2)
            return;
        var prev = historyRef.current[historyRef.current.length - 2];
        isTimeTravelRef.current = true;
        futureRef.current = __spreadArray([{ nodes: nodes, edges: edges }], futureRef.current, true).slice(0, 50);
        historyRef.current = historyRef.current.slice(0, historyRef.current.length - 1);
        setNodes(prev.nodes);
        setEdges(prev.edges);
    };
    var redo = function () {
        if (futureRef.current.length === 0)
            return;
        var next = futureRef.current[0];
        isTimeTravelRef.current = true;
        historyRef.current = __spreadArray(__spreadArray([], historyRef.current.slice(-49), true), [next], false);
        setNodes(next.nodes);
        setEdges(next.edges);
        futureRef.current = futureRef.current.slice(1);
    };
    return { undo: undo, redo: redo };
}
function useAgentBuilderKeyboardShortcuts(_a) {
    var undo = _a.undo, redo = _a.redo;
    (0, react_1.useEffect)(function () {
        var handler = function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handler);
        return function () { return window.removeEventListener('keydown', handler); };
    }, [undo, redo]);
}
function useAgentBuilderDragPanels(_a) {
    var draggingPane = _a.draggingPane, dragOffset = _a.dragOffset, setDraggingPane = _a.setDraggingPane, setDragOffset = _a.setDragOffset, setNodePalettePosition = _a.setNodePalettePosition, setSettingsPosition = _a.setSettingsPosition, setNodeConfigPosition = _a.setNodeConfigPosition;
    (0, react_1.useEffect)(function () {
        var handleMouseMove = function (event) {
            if (!draggingPane)
                return;
            var nextX = event.clientX - dragOffset.x;
            var nextY = event.clientY - dragOffset.y;
            var clampedX = Math.max(16, Math.min(nextX, window.innerWidth - 320));
            var clampedY = Math.max(16, Math.min(nextY, window.innerHeight - 120));
            if (draggingPane === 'palette') {
                setNodePalettePosition({ x: clampedX, y: clampedY });
            }
            else if (draggingPane === 'settings') {
                setSettingsPosition({ x: clampedX, y: clampedY });
            }
            else if (draggingPane === 'nodeConfig') {
                setNodeConfigPosition({ x: clampedX, y: clampedY });
            }
        };
        var handleMouseUp = function () {
            setDraggingPane(null);
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return function () {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [
        draggingPane,
        dragOffset,
        setDraggingPane,
        setDragOffset,
        setNodePalettePosition,
        setSettingsPosition,
        setNodeConfigPosition,
    ]);
}
function useAgentBuilderSocketExecution(_a) {
    var backendUrl = _a.backendUrl, nodes = _a.nodes, setNodes = _a.setNodes, setExecutionStatuses = _a.setExecutionStatuses, setCurrentExecutionId = _a.setCurrentExecutionId, setExecutionStatus = _a.setExecutionStatus, setCurrentExecutingNodeId = _a.setCurrentExecutingNodeId, setLog = _a.setLog, setIsExecuting = _a.setIsExecuting;
    var socketRef = (0, react_1.useRef)(null);
    var nodesRef = (0, react_1.useRef)(nodes);
    (0, react_1.useEffect)(function () {
        nodesRef.current = nodes;
    }, [nodes]);
    (0, react_1.useEffect)(function () {
        var socket = (0, socket_client_1.getSharedSocket)(backendUrl);
        socketRef.current = socket;
        var appendLog = function (message) {
            setLog(function (prev) {
                if (prev.some(function (entry) { return entry === message; })) {
                    return prev;
                }
                return __spreadArray(__spreadArray([], prev, true), [message], false);
            });
        };
        socket.on('execution-started', function (data) {
            console.log('[socket → agentBuilder] execution-started', data);
            setCurrentExecutionId(data.executionId);
            setExecutionStatuses(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[data.executionId] = {
                    status: 'running',
                    nodeStatuses: {},
                }, _a)));
            });
            setExecutionStatus('running');
            setIsExecuting(true);
            setNodes(nodesRef.current.map(function (node) { return (__assign(__assign({}, node), { data: __assign(__assign({}, node.data), { executionState: 'pending', executionError: null }) })); }));
            appendLog("Execution started: ".concat(data.executionId));
        });
        socket.on('node-started', function (data) {
            var _a;
            console.log('[socket → agentBuilder] node-started', data);
            setExecutionStatuses(function (prev) {
                var _a, _b;
                var _c;
                return (__assign(__assign({}, prev), (_a = {}, _a[data.executionId] = __assign(__assign({}, prev[data.executionId]), { nodeStatuses: __assign(__assign({}, (_c = prev[data.executionId]) === null || _c === void 0 ? void 0 : _c.nodeStatuses), (_b = {}, _b[data.nodeId] = 'executing', _b)) }), _a)));
            });
            setCurrentExecutingNodeId(data.nodeId);
            setNodes(nodesRef.current.map(function (node) {
                return node.id === data.nodeId
                    ? __assign(__assign({}, node), { data: __assign(__assign({}, node.data), { executionState: 'executing', executionError: null }) }) : node;
            }));
            var node = nodesRef.current.find(function (n) { return n.id === data.nodeId; });
            appendLog("Executing node: ".concat(((_a = node === null || node === void 0 ? void 0 : node.data) === null || _a === void 0 ? void 0 : _a.label) || data.nodeId));
        });
        socket.on('node-completed', function (data) {
            var _a, _b;
            console.log('[socket → agentBuilder] node-completed', data);
            setExecutionStatuses(function (prev) {
                var _a, _b;
                var _c;
                return (__assign(__assign({}, prev), (_a = {}, _a[data.executionId] = __assign(__assign({}, prev[data.executionId]), { nodeStatuses: __assign(__assign({}, (_c = prev[data.executionId]) === null || _c === void 0 ? void 0 : _c.nodeStatuses), (_b = {}, _b[data.nodeId] = data.success ? 'completed' : 'failed', _b)) }), _a)));
            });
            setNodes(nodesRef.current.map(function (node) {
                return node.id === data.nodeId
                    ? __assign(__assign({}, node), { data: __assign(__assign({}, node.data), { executionState: data.success ? 'completed' : 'failed', executionError: data.success ? null : data.error || 'Unknown error' }) }) : node;
            }));
            var node = nodesRef.current.find(function (n) { return n.id === data.nodeId; });
            if (data.success) {
                appendLog("Node completed: ".concat(((_a = node === null || node === void 0 ? void 0 : node.data) === null || _a === void 0 ? void 0 : _a.label) || data.nodeId));
            }
            else {
                appendLog("Node failed: ".concat(((_b = node === null || node === void 0 ? void 0 : node.data) === null || _b === void 0 ? void 0 : _b.label) || data.nodeId, " - ").concat(data.error || 'Unknown error'));
            }
        });
        socket.on('execution-completed', function (data) {
            console.log('[socket → agentBuilder] execution-completed', data);
            setExecutionStatuses(function (prev) {
                var _a;
                return (__assign(__assign({}, prev), (_a = {}, _a[data.executionId] = __assign(__assign({}, prev[data.executionId]), { status: data.success ? 'completed' : 'failed' }), _a)));
            });
            setExecutionStatus(data.success ? 'completed' : 'failed');
            setCurrentExecutingNodeId(null);
            setCurrentExecutionId(null);
            setIsExecuting(false);
            appendLog("Execution ".concat(data.success ? 'completed' : 'failed', ": ").concat(data.executionId));
        });
        return function () {
            // Shared socket is reused across the builder, so do not disconnect here.
        };
    }, [
        backendUrl,
        setCurrentExecutionId,
        setExecutionStatus,
        setExecutionStatuses,
        setCurrentExecutingNodeId,
        setLog,
        setIsExecuting,
    ]);
    return socketRef;
}
function useAgentBuilderExecutionStateSync(_a) {
    var currentExecutionId = _a.currentExecutionId, executionStatuses = _a.executionStatuses, nodes = _a.nodes, setNodes = _a.setNodes;
    (0, react_1.useEffect)(function () {
        if (!currentExecutionId)
            return;
        var execStatus = executionStatuses[currentExecutionId];
        if (!execStatus)
            return;
        var updatedNodes = nodes.map(function (node) { return (__assign(__assign({}, node), { data: __assign(__assign({}, node.data), { executionState: execStatus.nodeStatuses[node.id] || null }) })); });
        setNodes(updatedNodes);
    }, [currentExecutionId, executionStatuses, nodes, setNodes]);
}
function useAgentBuilderDataLoader(_a) {
    var _this = this;
    var currentUser = _a.currentUser, setWorkflows = _a.setWorkflows, setUserAgents = _a.setUserAgents, setCredentials = _a.setCredentials, setLog = _a.setLog;
    var getAuthToken = function () { return __awaiter(_this, void 0, void 0, function () {
        var session;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, supabaseClient_1.supabase.auth.getSession()];
                case 1:
                    session = _c.sent();
                    return [2 /*return*/, ((_b = (_a = session === null || session === void 0 ? void 0 : session.data) === null || _a === void 0 ? void 0 : _a.session) === null || _b === void 0 ? void 0 : _b.access_token) || null];
            }
        });
    }); };
    var loadUserAgents = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.id))
                        return [2 /*return*/];
                    return [4 /*yield*/, supabaseClient_1.supabase
                            .from('user_agents')
                            .select('*')
                            .eq('user_id', currentUser.id)
                            .order('updated_at', { ascending: false })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (!error && data) {
                        setUserAgents(data);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var loadCredentials = function () { return __awaiter(_this, void 0, void 0, function () {
        var token, response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.id))
                        return [2 /*return*/];
                    return [4 /*yield*/, getAuthToken()];
                case 1:
                    token = _a.sent();
                    if (!token)
                        return [2 /*return*/];
                    return [4 /*yield*/, fetch('/api/credentials', {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: "Bearer ".concat(token),
                            },
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    if (!data.error) {
                        setCredentials(data.credentials || []);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    var loadWorkflows = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabaseClient_1.supabase
                        .from('workflows')
                        .select('*')
                        .order('updated_at', { ascending: false })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (!error && data) {
                        setWorkflows(data);
                    }
                    return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        loadWorkflows();
        loadUserAgents();
        loadCredentials();
    }, [currentUser === null || currentUser === void 0 ? void 0 : currentUser.id]);
    return {
        loadUserAgents: loadUserAgents,
        loadCredentials: loadCredentials,
    };
}
function useAgentBuilderExecutionPoller(executionId, pollingExecution, fetchExecutionStatus) {
    (0, react_1.useEffect)(function () {
        if (!executionId || !pollingExecution)
            return;
        var intervalId = window.setInterval(function () {
            fetchExecutionStatus(executionId);
        }, 2000);
        fetchExecutionStatus(executionId);
        return function () { return window.clearInterval(intervalId); };
    }, [executionId, pollingExecution, fetchExecutionStatus]);
}
// Main effects hook that combines all functionality
function useAgentBuilderEffects(_a) {
    var nodes = _a.nodes, edges = _a.edges, workflowName = _a.workflowName, agentDescription = _a.agentDescription, selectedAgentId = _a.selectedAgentId, currentAgentStatus = _a.currentAgentStatus, setWorkflowName = _a.setWorkflowName, setAgentDescription = _a.setAgentDescription, setSelectedAgentId = _a.setSelectedAgentId, setCurrentAgentStatus = _a.setCurrentAgentStatus, setLog = _a.setLog, setApiKeys = _a.setApiKeys, setWorkflows = _a.setWorkflows, setUserAgents = _a.setUserAgents, setCredentials = _a.setCredentials, setExecutionStatuses = _a.setExecutionStatuses, setCurrentExecutionId = _a.setCurrentExecutionId, setExecutionStatus = _a.setExecutionStatus, setCurrentExecutingNodeId = _a.setCurrentExecutingNodeId, setNodes = _a.setNodes, setEdges = _a.setEdges, setIsExecuting = _a.setIsExecuting, socketRef = _a.socketRef, backendUrl = _a.backendUrl, user = _a.user, router = _a.router;
    // Autosave
    useAgentBuilderAutosave({
        nodes: nodes,
        edges: edges,
        workflowName: workflowName,
        agentDescription: agentDescription,
        selectedAgentId: selectedAgentId,
        currentAgentStatus: currentAgentStatus,
    });
    // History management
    var _b = useAgentBuilderHistory({ nodes: nodes, edges: edges, setNodes: setNodes, setEdges: setEdges }), undo = _b.undo, redo = _b.redo;
    // Keyboard shortcuts
    useAgentBuilderKeyboardShortcuts({ undo: undo, redo: redo });
    // Socket execution
    useAgentBuilderSocketExecution({
        backendUrl: backendUrl,
        nodes: nodes,
        setNodes: setNodes,
        setExecutionStatuses: setExecutionStatuses,
        setCurrentExecutionId: setCurrentExecutionId,
        setExecutionStatus: setExecutionStatus,
        setCurrentExecutingNodeId: setCurrentExecutingNodeId,
        setLog: setLog,
        setIsExecuting: setIsExecuting,
    });
    // Data loading
    useAgentBuilderDataLoader({
        currentUser: user,
        setWorkflows: setWorkflows,
        setUserAgents: setUserAgents,
        setCredentials: setCredentials,
        setLog: setLog,
    });
    return { undo: undo, redo: redo };
}
