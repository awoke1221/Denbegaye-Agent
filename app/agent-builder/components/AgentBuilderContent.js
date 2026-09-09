'use client';
'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
var __awaiter =
  (this && this.__awaiter) ||
  function (thisArg, _arguments, P, generator) {
    function adopt(value) {
      return value instanceof P
        ? value
        : new P(function (resolve) {
            resolve(value);
          });
    }
    return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      }
      function rejected(value) {
        try {
          step(generator['throw'](value));
        } catch (e) {
          reject(e);
        }
      }
      function step(result) {
        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
      }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
  };
var __generator =
  (this && this.__generator) ||
  function (thisArg, body) {
    var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: [],
      },
      f,
      y,
      t,
      g = Object.create((typeof Iterator === 'function' ? Iterator : Object).prototype);
    return (
      (g.next = verb(0)),
      (g['throw'] = verb(1)),
      (g['return'] = verb(2)),
      typeof Symbol === 'function' &&
        (g[Symbol.iterator] = function () {
          return this;
        }),
      g
    );
    function verb(n) {
      return function (v) {
        return step([n, v]);
      };
    }
    function step(op) {
      if (f) throw new TypeError('Generator is already executing.');
      while ((g && ((g = 0), op[0] && (_ = 0)), _))
        try {
          if (
            ((f = 1),
            y &&
              (t =
                op[0] & 2
                  ? y['return']
                  : op[0]
                    ? y['throw'] || ((t = y['return']) && t.call(y), 0)
                    : y.next) &&
              !(t = t.call(y, op[1])).done)
          )
            return t;
          if (((y = 0), t)) op = [op[0] & 2, t.value];
          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;
            case 4:
              _.label++;
              return { value: op[1], done: false };
            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;
            case 7:
              op = _.ops.pop();
              _.trys.pop();
              continue;
            default:
              if (
                !((t = _.trys), (t = t.length > 0 && t[t.length - 1])) &&
                (op[0] === 6 || op[0] === 2)
              ) {
                _ = 0;
                continue;
              }
              if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                _.label = op[1];
                break;
              }
              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }
              if (t && _.label < t[2]) {
                _.label = t[2];
                _.ops.push(op);
                break;
              }
              if (t[2]) _.ops.pop();
              _.trys.pop();
              continue;
          }
          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }
      if (op[0] & 5) throw op[1];
      return { value: op[0] ? op[1] : void 0, done: true };
    }
  };
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.AgentBuilderContent = AgentBuilderContent;
var react_1 = require('react');
var navigation_1 = require('next/navigation');
var reactflow_1 = require('reactflow');
require('reactflow/dist/style.css');
var socket_client_1 = require('@/lib/socket-client');
var NodeRegistry_1 = require('@/components/agent-nodes/NodeRegistry');
var AuthContext_1 = require('@/contexts/AuthContext');
var agentBuilderStore_1 = require('@/stores/agentBuilderStore');
var agentBuilderTemplates_1 = require('@/lib/agentBuilderTemplates');
var supabaseClient_1 = require('@/lib/supabaseClient');
var webhook_manager_1 = require('@/components/webhook-manager');
var button_1 = require('@/components/ui/button');
var input_1 = require('@/components/ui/input');
var label_1 = require('@/components/ui/label');
var textarea_1 = require('@/components/ui/textarea');
var checkbox_1 = require('@/components/ui/checkbox');
var select_1 = require('@/components/ui/select');
var dialog_1 = require('@/components/ui/dialog');
var nodeTypes_1 = require('../constants/nodeTypes');
var AgentBuilderSidebar_1 = require('./AgentBuilderSidebar');
var ExecutionControls_1 = require('./ExecutionControls');
var AgentBuilderCanvas_1 = require('./AgentBuilderCanvas');
var NodeManagement_1 = require('./NodeManagement');
var AgentBuilderDashboard_1 = require('./AgentBuilderDashboard');
var AgentBuilderTemplates_1 = require('./AgentBuilderTemplates');
var AgentBuilderVault_1 = require('./AgentBuilderVault');
var AgentBuilderSettings_1 = require('./AgentBuilderSettings');
var AgentBuilderLogPanel_1 = require('./AgentBuilderLogPanel');
var useAgentBuilderEffects_1 = require('./useAgentBuilderEffects');
function AgentBuilderContent() {
  var _this = this;
  // Context menu state
  var _a = (0, react_1.useState)({ type: null, x: 0, y: 0 }),
    contextMenu = _a[0],
    setContextMenu = _a[1];
  var _b = (0, react_1.useState)(false),
    sidebarCollapsed = _b[0],
    setSidebarCollapsed = _b[1];
  var _c = (0, react_1.useState)(false),
    isAdmin = _c[0],
    setIsAdmin = _c[1];
  var _d = (0, react_1.useState)(false),
    showTemplateDialog = _d[0],
    setShowTemplateDialog = _d[1];
  var _e = (0, react_1.useState)({
      name: '',
      description: '',
      category: 'Agentic Workflow',
      is_public: true,
      version: '1.0.0',
    }),
    templateForm = _e[0],
    setTemplateForm = _e[1];
  var _f = (0, react_1.useState)(false),
    savingTemplate = _f[0],
    setSavingTemplate = _f[1];
  var templateCategories = [
    'Agentic Workflow',
    'Business Automation',
    'Content Creation',
    'Marketing',
    'Customer Service',
    'Productivity',
    'Sales',
    'E-commerce',
    'Finance',
    'Data Analysis',
    'Operations',
    'Education',
    'Healthcare',
    'Other',
  ];
  // Execution state
  var _g = (0, react_1.useState)({}),
    executionStatuses = _g[0],
    setExecutionStatuses = _g[1];
  var _h = (0, react_1.useState)(null),
    currentExecutionId = _h[0],
    setCurrentExecutionId = _h[1];
  var socketRef = (0, react_1.useRef)(null);
  var router = (0, navigation_1.useRouter)();
  var _j = (0, AuthContext_1.useAuth)(),
    user = _j.user,
    loading = _j.loading;
  var _k = (0, agentBuilderStore_1.useAgentBuilderStore)(),
    nodes = _k.nodes,
    edges = _k.edges,
    selectedNodeId = _k.selectedNodeId,
    setNodes = _k.setNodes,
    setEdges = _k.setEdges,
    selectNode = _k.selectNode,
    reset = _k.reset;
  var nodesRef = (0, react_1.useRef)(nodes);
  var oauthRedirectHandledRef = (0, react_1.useRef)(false);
  (0, react_1.useEffect)(
    function () {
      nodesRef.current = nodes;
    },
    [nodes]
  );
  // Search/filter state (must be after nodes/edges)
  var _l = (0, react_1.useState)(''),
    searchQuery = _l[0],
    setSearchQuery = _l[1];
  // Compute filtered/highlighted nodes/edges
  var filteredNodeIds = (0, react_1.useMemo)(
    function () {
      if (!searchQuery.trim()) return [];
      var q = searchQuery.toLowerCase();
      return nodes
        .filter(function (n) {
          var _a, _b, _c, _d, _e;
          return (
            (
              ((_c =
                (_b = (_a = n.data) === null || _a === void 0 ? void 0 : _a.label) === null ||
                _b === void 0
                  ? void 0
                  : _b.toLowerCase) === null || _c === void 0
                ? void 0
                : _c.call(_b)) || ''
            ).includes(q) ||
            n.id.toLowerCase().includes(q) ||
            (
              ((_e = (_d = n.type) === null || _d === void 0 ? void 0 : _d.toLowerCase) === null ||
              _e === void 0
                ? void 0
                : _e.call(_d)) || ''
            ).includes(q)
          );
        })
        .map(function (n) {
          return n.id;
        });
    },
    [searchQuery, nodes]
  );
  var filteredEdgeIds = (0, react_1.useMemo)(
    function () {
      if (!searchQuery.trim()) return [];
      var q = searchQuery.toLowerCase();
      return edges
        .filter(function (e) {
          return (
            e.id.toLowerCase().includes(q) ||
            (e.source && e.source.toLowerCase().includes(q)) ||
            (e.target && e.target.toLowerCase().includes(q))
          );
        })
        .map(function (e) {
          return e.id;
        });
    },
    [searchQuery, edges]
  );
  // Templates state
  var _m = (0, react_1.useState)(''),
    templateSearchQuery = _m[0],
    setTemplateSearchQuery = _m[1];
  var _o = (0, react_1.useState)('all'),
    selectedCategory = _o[0],
    setSelectedCategory = _o[1];
  var filteredTemplates = (0, react_1.useMemo)(
    function () {
      return agentBuilderTemplates_1.AgentBuilderTemplates.filter(function (template) {
        var matchesSearch =
          templateSearchQuery === '' ||
          template.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
          template.category.toLowerCase().includes(templateSearchQuery.toLowerCase());
        var matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
      });
    },
    [templateSearchQuery, selectedCategory]
  );
  // Helper function to render icons consistently
  var renderIcon = function (icon, className) {
    if (className === void 0) {
      className = '';
    }
    if (typeof icon === 'function') {
      var IconComponent = icon;
      return <IconComponent className={className} />;
    } else if (typeof icon === 'string' && icon.startsWith('<svg')) {
      return <div className={className} dangerouslySetInnerHTML={{ __html: icon }} />;
    } else if (typeof icon === 'string') {
      // It's a Lucide icon name
      var IconComponent = (0, NodeRegistry_1.getNodeIcon)(icon);
      return <IconComponent className={className} />;
    } else {
      // Fallback
      return <div className={className}>⚙️</div>;
    }
  };
  // Utility: duplicate node
  var duplicateNode = function (nodeId) {
    var _a;
    var node = nodes.find(function (n) {
      return n.id === nodeId;
    });
    if (!node) return;
    var position = (_a = node.position) !== null && _a !== void 0 ? _a : { x: 0, y: 0 };
    var newNode = __assign(__assign({}, node), {
      id: ''.concat(Date.now()),
      position: { x: position.x + 40, y: position.y + 40 },
      data: __assign(__assign({}, node.data), { label: node.data.label + ' (Copy)' }),
    });
    setNodes(__spreadArray(__spreadArray([], nodes, true), [newNode], false));
  };
  // Utility: clone edge
  var duplicateEdge = function (edgeId) {
    var edge = edges.find(function (e) {
      return e.id === edgeId;
    });
    if (!edge) return;
    var newEdge = __assign(__assign({}, edge), { id: ''.concat(Date.now()) });
    setEdges(__spreadArray(__spreadArray([], edges, true), [newEdge], false));
  };
  // Utility: copy config
  var copyConfig = function (config) {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setLog(function (prev) {
      return __spreadArray(__spreadArray([], prev, true), ['Config copied to clipboard'], false);
    });
  };
  var formatErrorMessage = function (error) {
    if (error instanceof Error) return error.message;
    if (typeof error === 'string') return error;
    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.stringify(error);
      } catch (_a) {
        return 'Unknown error object';
      }
    }
    return String(error);
  };
  var parseResponseBody = function (response) {
    return __awaiter(_this, void 0, void 0, function () {
      var text;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [4 /*yield*/, response.text()];
          case 1:
            text = _a.sent();
            try {
              return [2 /*return*/, JSON.parse(text)];
            } catch (_b) {
              return [2 /*return*/, text];
            }
            return [2 /*return*/];
        }
      });
    });
  };
  var extractValidationNodeIds = function (messages) {
    var nodeIds = {};
    messages.forEach(function (message) {
      var match = message.match(/Node\s+([\w-]+):\s*(.*)/i);
      if (match) {
        var nodeId = match[1];
        var text = match[2] || message;
        nodeIds[nodeId] = nodeIds[nodeId] || [];
        nodeIds[nodeId].push(text);
      }
    });
    return nodeIds;
  };
  var applyValidationErrorsToNodes = function (errors) {
    var nodesWithErrors = extractValidationNodeIds(errors);
    if (Object.keys(nodesWithErrors).length === 0) return;
    var updatedNodes = nodes.map(function (node) {
      var nodeErrors = nodesWithErrors[node.id];
      if (!nodeErrors) return node;
      return __assign(__assign({}, node), {
        data: __assign(__assign({}, node.data), {
          executionState: 'failed',
          executionError: nodeErrors.join('; '),
        }),
      });
    });
    setNodes(updatedNodes);
  };
  var getNodeConfigurationErrors = function (node) {
    var _a, _b, _c;
    var config = ((_a = node.data) === null || _a === void 0 ? void 0 : _a.config) || {};
    var input = ((_b = node.data) === null || _b === void 0 ? void 0 : _b.input) || {};
    var type = node.type;
    var errors = [];
    if (type && (type === 'ai' || type.startsWith('ai-'))) {
      if (!config.systemPrompt && !config.messages && !input.prompt && !config.inputText) {
        errors.push(
          'Node '.concat(node.id, ': AI nodes require a prompt or messages configuration')
        );
      }
      if (!config.inputText && !input.inputText) {
        errors.push('Node '.concat(node.id, ': Input Text is required'));
      }
    }
    if (type && (type === 'api' || type === 'core-http-request')) {
      if (!config.url && !config.endpoint) {
        errors.push('Node '.concat(node.id, ': API nodes require a URL or endpoint configuration'));
      }
    }
    if (type === 'action-email') {
      if (!config.to && !config.recipients && !input.to) {
        errors.push(
          'Node '.concat(node.id, ': Email action nodes require recipient configuration')
        );
      }
    }
    if (type === 'action-webhook') {
      if (!config.url && !input.url) {
        errors.push('Node '.concat(node.id, ': Webhook action nodes require a URL configuration'));
      }
    }
    if (type === 'trigger-schedule') {
      if (!config.cronExpression && !config.interval) {
        errors.push(
          'Node '.concat(node.id, ': Schedule trigger nodes require a cron expression or interval')
        );
      }
    }
    if (type === 'core-code-js' || type === 'core-code-python') {
      if (!config.code && !input.code) {
        errors.push(
          'Node '.concat(node.id, ': Code execution nodes require a code block configuration')
        );
      }
    }
    if (type === 'logic-delay') {
      if (!config.duration && !input.duration) {
        errors.push('Node '.concat(node.id, ': Delay nodes require a duration configuration'));
      }
    }
    if (type === 'logic-if' || type === 'core-if') {
      if (!config.condition && !input.condition) {
        errors.push('Node '.concat(node.id, ': Logic nodes require a condition configuration'));
      }
    }
    if (type === 'logic-loop') {
      if (!config.iterations && !config.condition) {
        errors.push(
          'Node '.concat(node.id, ': Loop nodes require either iterations count or exit condition')
        );
      }
    }
    if (type === 'core-set' || type === 'core-transform') {
      if (!config.expression) {
        errors.push(
          'Node '.concat(node.id, ': Transform nodes require an expression configuration')
        );
      }
    }
    if (type === 'action-save-db') {
      if (!config.table && !config.collection) {
        errors.push(
          'Node '.concat(node.id, ': Database action nodes require table/collection configuration')
        );
      }
    }
    var metadata = getNodeTypeMetadata(type);
    if (
      (_c = metadata === null || metadata === void 0 ? void 0 : metadata.configs) === null ||
      _c === void 0
        ? void 0
        : _c.length
    ) {
      metadata.configs.forEach(function (field) {
        if (field.required === false) return;
        var key = normalizeConfigKey(field.l);
        var message = 'Node '.concat(node.id, ': ').concat(field.l, ' is required');
        if (!isConfiguredValue(config[key]) && !errors.includes(message)) {
          errors.push(message);
        }
      });
    }
    return errors;
  };
  var validateWorkflowGraph = function (nodes, edges) {
    var errors = [];
    var nodeIds = new Set(
      nodes.map(function (node) {
        return node.id;
      })
    );
    edges.forEach(function (edge) {
      if (!edge.source || !nodeIds.has(edge.source)) {
        errors.push('Edge '.concat(edge.id, ' has invalid source: ').concat(edge.source));
      }
      if (!edge.target || !nodeIds.has(edge.target)) {
        errors.push('Edge '.concat(edge.id, ' has invalid target: ').concat(edge.target));
      }
    });
    var missingTypes = nodes
      .filter(function (node) {
        return !node.type || !(node.type in nodeTypes_1.nodeTypes);
      })
      .map(function (node) {
        return node.type || 'unknown';
      });
    if (missingTypes.length > 0) {
      errors.push(
        'Missing or unsupported node types: '.concat(Array.from(new Set(missingTypes)).join(', '))
      );
    }
    var inDegree = {};
    nodes.forEach(function (node) {
      inDegree[node.id] = 0;
    });
    edges.forEach(function (edge) {
      if (edge.target && inDegree[edge.target] !== undefined) {
        inDegree[edge.target]++;
      }
    });
    var roots = nodes.filter(function (node) {
      return inDegree[node.id] === 0;
    });
    if (roots.length === 0) {
      errors.push('No starting node found; the graph may contain a cycle or have no entry point.');
    }
    nodes.forEach(function (node) {
      errors.push.apply(errors, getNodeConfigurationErrors(node));
    });
    return errors;
  };
  // Inline node editing state
  var _p = (0, react_1.useState)(null),
    editingNodeId = _p[0],
    setEditingNodeId = _p[1];
  var _q = (0, react_1.useState)(''),
    editingNodeLabel = _q[0],
    setEditingNodeLabel = _q[1];
  // Start editing on double click
  var onNodeDoubleClick = function (_event, node) {
    setEditingNodeId(node.id);
    setEditingNodeLabel(node.data.label || '');
  };
  // Save label on blur or Enter
  var saveInlineEdit = function () {
    if (editingNodeId) {
      var updatedNodes = nodes.map(function (n) {
        return n.id === editingNodeId
          ? __assign(__assign({}, n), {
              data: __assign(__assign({}, n.data), { label: editingNodeLabel }),
            })
          : n;
      });
      setNodes(updatedNodes);
    }
    setEditingNodeId(null);
    setEditingNodeLabel('');
  };
  // Undo/Redo state (must be after nodes/edges/setNodes/setEdges)
  var _r = (0, react_1.useState)([]),
    history = _r[0],
    setHistory = _r[1];
  var _s = (0, react_1.useState)([]),
    future = _s[0],
    setFuture = _s[1];
  var isTimeTravelRef = (0, react_1.useRef)(false);
  var _t = (0, react_1.useState)('Untitled Agent Workflow'),
    workflowName = _t[0],
    setWorkflowName = _t[1];
  var _u = (0, react_1.useState)(''),
    agentDescription = _u[0],
    setAgentDescription = _u[1];
  var _v = (0, react_1.useState)(null),
    selectedAgentId = _v[0],
    setSelectedAgentId = _v[1];
  var _w = (0, react_1.useState)('draft'),
    currentAgentStatus = _w[0],
    setCurrentAgentStatus = _w[1];
  var _x = (0, react_1.useState)([]),
    log = _x[0],
    setLog = _x[1];
  var _y = (0, react_1.useState)({
      openai: '',
      gemini: '',
      deepseek: '',
      gmail: '',
    }),
    apiKeys = _y[0],
    setApiKeys = _y[1];
  var _z = (0, react_1.useState)([]),
    workflows = _z[0],
    setWorkflows = _z[1];
  var _0 = (0, react_1.useState)([]),
    userAgents = _0[0],
    setUserAgents = _0[1];
  var _1 = (0, react_1.useState)([]),
    credentials = _1[0],
    setCredentials = _1[1];
  var _2 = (0, react_1.useState)({
      provider: 'openai',
      label: '',
      apiKey: '',
    }),
    credentialForm = _2[0],
    setCredentialForm = _2[1];
  var _3 = (0, react_1.useState)('builder'),
    activeSection = _3[0],
    setActiveSection = _3[1];
  var _4 = (0, react_1.useState)(true),
    showNodePalette = _4[0],
    setShowNodePalette = _4[1];
  var _5 = (0, react_1.useState)({ x: 80, y: 80 }),
    nodePalettePosition = _5[0],
    setNodePalettePosition = _5[1];
  var _6 = (0, react_1.useState)({ x: 80, y: 80 }),
    settingsPosition = _6[0],
    setSettingsPosition = _6[1];
  var _7 = (0, react_1.useState)({ x: 80, y: 80 }),
    nodeConfigPosition = _7[0],
    setNodeConfigPosition = _7[1];
  var _8 = (0, react_1.useState)(null),
    draggingPane = _8[0],
    setDraggingPane = _8[1];
  var _9 = (0, react_1.useState)(false),
    showLogPanel = _9[0],
    setShowLogPanel = _9[1];
  var selectedNode = nodes.find(function (n) {
    return n.id === selectedNodeId;
  });
  var draftUserAgents = userAgents.filter(function (agent) {
    return agent.status === 'draft';
  });
  var activeUserAgents = userAgents.filter(function (agent) {
    return agent.status === 'active';
  });
  (0, react_1.useEffect)(function () {
    if (typeof window !== 'undefined') {
      setNodeConfigPosition({ x: window.innerWidth - 400, y: 80 });
    }
  }, []);
  var _10 = (0, react_1.useState)({ x: 0, y: 0 }),
    dragOffset = _10[0],
    setDragOffset = _10[1];
  var _11 = (0, react_1.useState)(false),
    isExecuting = _11[0],
    setIsExecuting = _11[1];
  var _12 = (0, react_1.useState)(null),
    executionId = _12[0],
    setExecutionId = _12[1];
  var _13 = (0, react_1.useState)(null),
    executionStatus = _13[0],
    setExecutionStatus = _13[1];
  var _14 = (0, react_1.useState)(null),
    executionResult = _14[0],
    setExecutionResult = _14[1];
  var _15 = (0, react_1.useState)(null),
    executionError = _15[0],
    setExecutionError = _15[1];
  var _16 = (0, react_1.useState)(false),
    pollingExecution = _16[0],
    setPollingExecution = _16[1];
  var _17 = (0, react_1.useState)(null),
    currentExecutingNodeId = _17[0],
    setCurrentExecutingNodeId = _17[1];
  var backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
  var _18 = (0, react_1.useState)(false),
    isLoadingTemplate = _18[0],
    setIsLoadingTemplate = _18[1];
  // Use the extracted effects hook
  var _19 = (0, useAgentBuilderEffects_1.useAgentBuilderEffects)({
      nodes: nodes,
      edges: edges,
      workflowName: workflowName,
      agentDescription: agentDescription,
      selectedAgentId: selectedAgentId,
      currentAgentStatus: currentAgentStatus,
      setWorkflowName: setWorkflowName,
      setAgentDescription: setAgentDescription,
      setSelectedAgentId: setSelectedAgentId,
      setCurrentAgentStatus: setCurrentAgentStatus,
      setLog: setLog,
      setApiKeys: setApiKeys,
      setWorkflows: setWorkflows,
      setUserAgents: setUserAgents,
      setCredentials: setCredentials,
      setExecutionStatuses: setExecutionStatuses,
      setCurrentExecutionId: setCurrentExecutionId,
      setExecutionStatus: setExecutionStatus,
      setCurrentExecutingNodeId: setCurrentExecutingNodeId,
      setNodes: setNodes,
      setEdges: setEdges,
      setIsExecuting: setIsExecuting,
      socketRef: socketRef,
      backendUrl: backendUrl,
      user: user,
      router: router,
    }),
    undo = _19.undo,
    redo = _19.redo;
  // Persist state to localStorage (autosave)
  (0, react_1.useEffect)(
    function () {
      var saveTimer = window.setTimeout(function () {
        try {
          localStorage.setItem(
            'agent-builder-workflow',
            JSON.stringify({
              nodes: nodes,
              edges: edges,
              name: workflowName,
              description: agentDescription,
              selectedAgentId: selectedAgentId,
              currentAgentStatus: currentAgentStatus,
            })
          );
        } catch (error) {
          console.error('Failed to autosave builder state', error);
        }
      }, 500);
      return function () {
        return window.clearTimeout(saveTimer);
      };
    },
    [nodes, edges, workflowName, selectedAgentId, currentAgentStatus]
  );
  // Push to history on every node/edge change (but skip during undo/redo)
  (0, react_1.useEffect)(
    function () {
      if (isTimeTravelRef.current) {
        isTimeTravelRef.current = false;
        return;
      }
      setHistory(function (h) {
        return __spreadArray(
          __spreadArray([], h.slice(-49), true),
          [{ nodes: nodes, edges: edges }],
          false
        );
      }); // cap 50 entries
      setFuture([]);
    },
    [nodes, edges]
  );
  // Undo handler
  var undoHandler = function () {
    if (history.length < 2) return;
    var prev = history[history.length - 2];
    isTimeTravelRef.current = true;
    setFuture(function (f) {
      return __spreadArray([{ nodes: nodes, edges: edges }], f, true).slice(0, 50);
    });
    setHistory(function (h) {
      return h.slice(0, h.length - 1);
    });
    setNodes(prev.nodes);
    setEdges(prev.edges);
  };
  // Redo handler
  var redoHandler = function () {
    if (future.length === 0) return;
    var next = future[0];
    isTimeTravelRef.current = true;
    setHistory(function (h) {
      return __spreadArray(__spreadArray([], h.slice(-49), true), [next], false);
    });
    setHistory(function (h) {
      return __spreadArray(__spreadArray([], h.slice(-49), true), [next], false);
    });
    setNodes(next.nodes);
    setEdges(next.edges);
    setFuture(function (f) {
      return f.slice(1);
    });
  };
  // Keyboard shortcuts
  (0, react_1.useEffect)(function () {
    var handler = function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undoHandler();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        redoHandler();
      }
    };
    window.addEventListener('keydown', handler);
    return function () {
      return window.removeEventListener('keydown', handler);
    };
  }, []);
  // Auth hook
  var currentUser = (0, AuthContext_1.useAuth)().user;
  (0, react_1.useEffect)(
    function () {
      var handleMouseMove = function (event) {
        if (!draggingPane) return;
        var nextX = event.clientX - dragOffset.x;
        var nextY = event.clientY - dragOffset.y;
        var clampedX = Math.max(16, Math.min(nextX, window.innerWidth - 320));
        var clampedY = Math.max(16, Math.min(nextY, window.innerHeight - 120));
        if (draggingPane === 'palette') {
          setNodePalettePosition({ x: clampedX, y: clampedY });
        } else if (draggingPane === 'settings') {
          setSettingsPosition({ x: clampedX, y: clampedY });
        } else if (draggingPane === 'nodeConfig') {
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
    },
    [draggingPane, dragOffset]
  );
  // Socket.IO connection for real-time execution updates
  (0, react_1.useEffect)(function () {
    var socket = (0, socket_client_1.getSharedSocket)();
    socketRef.current = socket;
    var appendLog = function (message) {
      setLog(function (prev) {
        if (
          prev.some(function (entry) {
            return entry === message;
          })
        ) {
          return prev;
        }
        return __spreadArray(__spreadArray([], prev, true), [message], false);
      });
    };
    var initializeExecutionState = function (executionId) {
      setCurrentExecutionId(executionId);
      setExecutionStatuses(function (prev) {
        var _a;
        return __assign(
          __assign({}, prev),
          ((_a = {}),
          (_a[executionId] = {
            status: 'running',
            nodeStatuses: {},
          }),
          _a)
        );
      });
      setExecutionStatus('running');
      setIsExecuting(true);
      setNodes(
        nodesRef.current.map(function (node) {
          return __assign(__assign({}, node), {
            data: __assign(__assign({}, node.data), {
              executionState: 'pending',
              executionError: null,
            }),
          });
        })
      );
      appendLog('Execution started: '.concat(executionId));
    };
    socket.on('execution-started', function (data) {
      console.log('[socket → agentBuilder] execution-started', data);
      initializeExecutionState(data.executionId);
    });
    socket.on('node-started', function (data) {
      var _a;
      console.log('[socket → agentBuilder] node-started', data);
      setExecutionStatuses(function (prev) {
        var _a, _b;
        var _c;
        return __assign(
          __assign({}, prev),
          ((_a = {}),
          (_a[data.executionId] = __assign(__assign({}, prev[data.executionId]), {
            nodeStatuses: __assign(
              __assign(
                {},
                (_c = prev[data.executionId]) === null || _c === void 0 ? void 0 : _c.nodeStatuses
              ),
              ((_b = {}), (_b[data.nodeId] = 'executing'), _b)
            ),
          })),
          _a)
        );
      });
      setCurrentExecutingNodeId(data.nodeId);
      setNodes(
        nodesRef.current.map(function (node) {
          return node.id === data.nodeId
            ? __assign(__assign({}, node), {
                data: __assign(__assign({}, node.data), {
                  executionState: 'executing',
                  executionError: null,
                }),
              })
            : node;
        })
      );
      var node = nodesRef.current.find(function (n) {
        return n.id === data.nodeId;
      });
      appendLog(
        'Executing node: '.concat(
          ((_a = node === null || node === void 0 ? void 0 : node.data) === null || _a === void 0
            ? void 0
            : _a.label) || data.nodeId
        )
      );
    });
    socket.on('node-completed', function (data) {
      var _a, _b;
      console.log('[socket → agentBuilder] node-completed', data);
      setExecutionStatuses(function (prev) {
        var _a, _b;
        var _c;
        return __assign(
          __assign({}, prev),
          ((_a = {}),
          (_a[data.executionId] = __assign(__assign({}, prev[data.executionId]), {
            nodeStatuses: __assign(
              __assign(
                {},
                (_c = prev[data.executionId]) === null || _c === void 0 ? void 0 : _c.nodeStatuses
              ),
              ((_b = {}), (_b[data.nodeId] = data.success ? 'completed' : 'failed'), _b)
            ),
          })),
          _a)
        );
      });
      setNodes(
        nodesRef.current.map(function (node) {
          return node.id === data.nodeId
            ? __assign(__assign({}, node), {
                data: __assign(__assign({}, node.data), {
                  executionState: data.success ? 'completed' : 'failed',
                  executionError: data.success
                    ? null
                    : data.error || data.errorStack || 'Unknown error',
                }),
              })
            : node;
        })
      );
      var node = nodesRef.current.find(function (n) {
        return n.id === data.nodeId;
      });
      if (data.success) {
        appendLog(
          'Node completed: '.concat(
            ((_a = node === null || node === void 0 ? void 0 : node.data) === null || _a === void 0
              ? void 0
              : _a.label) || data.nodeId
          )
        );
      } else {
        appendLog(
          'Node failed: '
            .concat(
              ((_b = node === null || node === void 0 ? void 0 : node.data) === null ||
              _b === void 0
                ? void 0
                : _b.label) || data.nodeId,
              ' - '
            )
            .concat(data.error || 'Unknown error')
        );
      }
    });
    socket.on('execution-completed', function (data) {
      console.log('[socket → agentBuilder] execution-completed', data);
      setExecutionStatuses(function (prev) {
        var _a;
        return __assign(
          __assign({}, prev),
          ((_a = {}),
          (_a[data.executionId] = __assign(__assign({}, prev[data.executionId]), {
            status: data.success ? 'completed' : 'failed',
          })),
          _a)
        );
      });
      setExecutionStatus(data.success ? 'completed' : 'failed');
      setCurrentExecutingNodeId(null);
      setCurrentExecutionId(null);
      setIsExecuting(false);
      appendLog(
        'Execution '.concat(data.success ? 'completed' : 'failed', ': ').concat(data.executionId)
      );
    });
    return function () {
      // Shared socket is reused across components, so do not disconnect here.
    };
  }, []);
  var loadUserAgents = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var _a, data, error;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.id))
              return [2 /*return*/];
            return [
              4 /*yield*/,
              supabaseClient_1.supabase
                .from('user_agents')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('updated_at', { ascending: false }),
            ];
          case 1:
            ((_a = _b.sent()), (data = _a.data), (error = _a.error));
            if (!error && data) {
              setUserAgents(data);
            }
            return [2 /*return*/];
        }
      });
    });
  };
  var getAuthToken = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var session;
      var _a, _b;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            return [4 /*yield*/, supabaseClient_1.supabase.auth.getSession()];
          case 1:
            session = _c.sent();
            return [
              2 /*return*/,
              ((_b =
                (_a = session === null || session === void 0 ? void 0 : session.data) === null ||
                _a === void 0
                  ? void 0
                  : _a.session) === null || _b === void 0
                ? void 0
                : _b.access_token) || null,
            ];
        }
      });
    });
  };
  var loadCredentials = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var token, response, data;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.id))
              return [2 /*return*/];
            return [4 /*yield*/, getAuthToken()];
          case 1:
            token = _a.sent();
            if (!token) return [2 /*return*/];
            return [
              4 /*yield*/,
              fetch('/api/credentials', {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer '.concat(token),
                },
              }),
            ];
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
    });
  };
  var createCredential = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var token, response, data;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.id)) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Please sign in to save credentials'],
                  false
                );
              });
              return [2 /*return*/];
            }
            return [4 /*yield*/, getAuthToken()];
          case 1:
            token = _a.sent();
            if (!token) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Unable to retrieve auth token'],
                  false
                );
              });
              return [2 /*return*/];
            }
            return [
              4 /*yield*/,
              fetch('/api/credentials', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer '.concat(token),
                },
                body: JSON.stringify({
                  provider: credentialForm.provider,
                  label: credentialForm.label || ''.concat(credentialForm.provider, ' key'),
                  apiKey: credentialForm.apiKey,
                }),
              }),
            ];
          case 2:
            response = _a.sent();
            return [4 /*yield*/, response.json()];
          case 3:
            data = _a.sent();
            if (data.error) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Credential save failed: '.concat(data.error)],
                  false
                );
              });
              return [2 /*return*/];
            }
            setCredentialForm({ provider: 'openai', label: '', apiKey: '' });
            loadCredentials();
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Credential saved for '.concat(credentialForm.provider)],
                false
              );
            });
            return [2 /*return*/];
        }
      });
    });
  };
  var saveApiKeys = function () {
    // TODO: implement saving API keys to localStorage or backend
    localStorage.setItem('agent-builder-api-keys', JSON.stringify(apiKeys));
    setLog(function (prev) {
      return __spreadArray(__spreadArray([], prev, true), ['API keys saved'], false);
    });
  };
  var exportAgentJson = function (agent) {
    var _a, _b;
    var payload = {
      name: agent.name || 'Untitled Agent',
      nodes: ((_a = agent.config) === null || _a === void 0 ? void 0 : _a.nodes) || [],
      edges: ((_b = agent.config) === null || _b === void 0 ? void 0 : _b.edges) || [],
      updatedAt: new Date().toISOString(),
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = ''.concat(agent.name || 'agent-workflow', '.json');
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setLog(function (prev) {
      return __spreadArray(
        __spreadArray([], prev, true),
        ['Exported agent JSON: '.concat(agent.name || 'Untitled Agent')],
        false
      );
    });
  };
  var normalizeAgentStatus = function (status) {
    return status === 'active' ? 'active' : 'draft';
  };
  var loadCredentialIntoNode = function (provider, nodeId) {
    var targetNode = nodes.find(function (n) {
      return n.id === nodeId || selectedNodeId;
    });
    if (!targetNode) return;
    var updatedNodes = nodes.map(function (n) {
      return n.id === targetNode.id
        ? __assign(__assign({}, n), {
            data: __assign(__assign({}, n.data), {
              config: __assign(__assign({}, n.data.config || {}), { credentialProvider: provider }),
            }),
          })
        : n;
    });
    setNodes(updatedNodes);
  };
  var loadUserAgent = function (agent) {
    var _a, _b;
    setSelectedAgentId(agent.id);
    setWorkflowName(agent.name || 'Untitled Agent Workflow');
    setAgentDescription(agent.description || '');
    setCurrentAgentStatus(normalizeAgentStatus(agent.status || 'draft'));
    setNodes(((_a = agent.config) === null || _a === void 0 ? void 0 : _a.nodes) || []);
    setEdges(((_b = agent.config) === null || _b === void 0 ? void 0 : _b.edges) || []);
    setActiveSection('builder');
    setLog(function (prev) {
      return __spreadArray(
        __spreadArray([], prev, true),
        ['Loaded agent "'.concat(agent.name, '" into the builder.')],
        false
      );
    });
  };
  var exportDashboardReport = function () {
    var report = {
      generatedAt: new Date().toISOString(),
      agents: userAgents,
      workflows: workflows,
      executionStatuses: executionStatuses,
    };
    var blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'agent-dashboard-report-'.concat(new Date().toISOString(), '.json');
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setLog(function (prev) {
      return __spreadArray(
        __spreadArray([], prev, true),
        ['Exported dashboard report successfully'],
        false
      );
    });
  };
  var clearExecutions = function () {
    setExecutionStatuses({});
    setLog(function (prev) {
      return __spreadArray(__spreadArray([], prev, true), ['Cleared execution history'], false);
    });
  };
  var createNewAgentWorkflow = function () {
    selectNode(undefined);
    setSelectedAgentId(null);
    setCurrentAgentStatus('draft');
    setWorkflowName('Untitled Agent Workflow');
    setAgentDescription('');
    setNodes([]);
    setEdges([]);
    setActiveSection('builder');
    setLog(function (prev) {
      return __spreadArray(__spreadArray([], prev, true), ['Started a new agent workflow'], false);
    });
    localStorage.removeItem('agent-builder-workflow');
  };
  var publishAgent = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var error;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            if (!selectedAgentId) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Save draft first before publishing'],
                  false
                );
              });
              return [2 /*return*/];
            }
            return [
              4 /*yield*/,
              supabaseClient_1.supabase
                .from('user_agents')
                .update({
                  status: 'active',
                  name: workflowName,
                  description: agentDescription,
                  config: { nodes: nodes, edges: edges },
                })
                .eq('id', selectedAgentId),
            ];
          case 1:
            error = _a.sent().error;
            if (error) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Failed to publish agent: '.concat(error.message)],
                  false
                );
              });
              return [2 /*return*/];
            }
            setCurrentAgentStatus('active');
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Agent published: '.concat(workflowName)],
                false
              );
            });
            return [4 /*yield*/, loadUserAgents()];
          case 2:
            _a.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  var deleteAgent = function (agentId) {
    return __awaiter(_this, void 0, void 0, function () {
      var confirmed, error;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            confirmed = window.confirm('Delete this agent permanently?');
            if (!confirmed) return [2 /*return*/];
            return [
              4 /*yield*/,
              supabaseClient_1.supabase.from('user_agents').delete().eq('id', agentId),
            ];
          case 1:
            error = _a.sent().error;
            if (error) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Delete failed: '.concat(error.message)],
                  false
                );
              });
              return [2 /*return*/];
            }
            if (selectedAgentId === agentId) {
              setSelectedAgentId(null);
              setWorkflowName('Untitled Agent Workflow');
              setNodes([]);
              setEdges([]);
              setCurrentAgentStatus('draft');
            }
            return [4 /*yield*/, loadUserAgents()];
          case 2:
            _a.sent();
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Agent deleted successfully'],
                false
              );
            });
            return [2 /*return*/];
        }
      });
    });
  };
  var setAgentStatus = function (agentId, status) {
    return __awaiter(_this, void 0, void 0, function () {
      var error;
      return __generator(this, function (_a) {
        switch (_a.label) {
          case 0:
            return [
              4 /*yield*/,
              supabaseClient_1.supabase
                .from('user_agents')
                .update({ status: status })
                .eq('id', agentId),
            ];
          case 1:
            error = _a.sent().error;
            if (error) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Failed to set status: '.concat(error.message)],
                  false
                );
              });
              return [2 /*return*/];
            }
            return [4 /*yield*/, loadUserAgents()];
          case 2:
            _a.sent();
            if (selectedAgentId === agentId) {
              setCurrentAgentStatus(status);
            }
            return [2 /*return*/];
        }
      });
    });
  };
  // Load saved workflows for Scheduler/Webhooks and user agents for dashboard
  (0, react_1.useEffect)(
    function () {
      var loadWorkflows = function () {
        return __awaiter(_this, void 0, void 0, function () {
          var _a, data, error;
          return __generator(this, function (_b) {
            switch (_b.label) {
              case 0:
                return [
                  4 /*yield*/,
                  supabaseClient_1.supabase
                    .from('workflows')
                    .select('*')
                    .order('updated_at', { ascending: false }),
                ];
              case 1:
                ((_a = _b.sent()), (data = _a.data), (error = _a.error));
                if (!error && data) {
                  setWorkflows(data);
                }
                return [2 /*return*/];
            }
          });
        });
      };
      loadWorkflows();
      loadUserAgents();
      loadCredentials();
    },
    [currentUser]
  );
  var nodeTypeCategory = function (nodeType) {
    var info = nodeTypes_1.availableNodeTypes.find(function (item) {
      return item.id === nodeType;
    });
    return (info === null || info === void 0 ? void 0 : info.category) || 'Unknown';
  };
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
  var isConfiguredValue = function (value) {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return true;
  };
  var getNodeTypeMetadata = function (type) {
    return type
      ? nodeTypes_1.availableNodeTypes.find(function (item) {
          return item.id === type;
        })
      : undefined;
  };
  var isNodeConfigured = function (node) {
    var _a, _b;
    var config = ((_a = node.data) === null || _a === void 0 ? void 0 : _a.config) || {};
    var metadata = getNodeTypeMetadata(node.type);
    if (
      (_b = metadata === null || metadata === void 0 ? void 0 : metadata.configs) === null ||
      _b === void 0
        ? void 0
        : _b.length
    ) {
      return metadata.configs.every(function (field) {
        if (field.required === false) return true;
        var key = normalizeConfigKey(field.l);
        return isConfiguredValue(config[key]);
      });
    }
    switch (node.type) {
      case 'ai-gemini':
        return !!(config.action && config.model && (config.credentialProvider || config.apiKey));
      case 'trigger-webhook':
        return !!(config.method && config.url);
      case 'trigger-email':
        return !!(config.mailbox && config.provider);
      case 'core-http-request':
        return !!(config.url && config.method);
      case 'action-telegram':
        return !!(config.botToken && config.chatId && config.message);
      case 'action-whatsapp':
        return !!(
          config.accountSid &&
          config.authToken &&
          config.from &&
          config.to &&
          config.message
        );
      case 'action-linkedin':
        return !!(config.accessToken && config.authorUrn && config.message);
      case 'action-youtube':
        return !!(config.accessToken && config.videoId && config.message);
      case 'action-facebook':
        return !!(config.pageId && config.accessToken && config.message);
      case 'calendar-google':
        return !!(config.calendarId && config.eventSummary && config.startISO && config.endISO);
      case 'data-google-sheets':
        switch (config.action) {
          case 'createSpreadsheet':
            return !!config.title;
          case 'listSpreadsheets':
            return true;
          case 'getMetadata':
          case 'createSheet':
          case 'deleteSheet':
          case 'batchUpdate':
          case 'formatCells':
          case 'bulkDeleteRows':
          case 'find':
          case 'clear':
          case 'append':
          case 'update':
          case 'delete':
          case 'upsert':
          case 'read':
            return !!config.spreadsheetId;
          default:
            return !!config.spreadsheetId;
        }
      default:
        return !!Object.keys(config).length;
    }
  };
  var formatGoogleSheetsActionLabel = function (action) {
    switch (action) {
      case 'read':
        return 'Read Data';
      case 'append':
        return 'Append Rows';
      case 'update':
        return 'Update Range';
      case 'delete':
        return 'Delete Rows';
      case 'clear':
        return 'Clear Range';
      case 'find':
        return 'Find Rows';
      case 'upsert':
        return 'Upsert Row';
      case 'createSpreadsheet':
        return 'Create Spreadsheet';
      case 'createSheet':
        return 'Create Sheet';
      case 'deleteSheet':
        return 'Delete Sheet';
      case 'getMetadata':
        return 'Get Metadata';
      case 'listSpreadsheets':
        return 'List Spreadsheets';
      case 'batchUpdate':
        return 'Batch Update';
      case 'formatCells':
        return 'Format Cells';
      case 'bulkDeleteRows':
        return 'Bulk Delete Rows';
      default:
        return 'Google Sheets';
    }
  };
  var formatGeminiActionLabel = function (action) {
    switch (action) {
      case 'generateText':
        return 'Generate Text';
      case 'sendChatMessage':
        return 'Chat Message';
      case 'analyzeImage':
        return 'Analyze Image';
      case 'generateJson':
        return 'Generate JSON';
      case 'countTokens':
        return 'Count Tokens';
      case 'createEmbedding':
        return 'Create Embedding';
      case 'summarizeContent':
        return 'Summarize Content';
      case 'classifyText':
        return 'Classify Text';
      case 'extractStructuredData':
        return 'Extract Data';
      case 'translateText':
        return 'Translate Text';
      case 'textToSpeech':
        return 'Text to Speech';
      case 'generateImage':
        return 'Generate Image';
      case 'generateVideo':
        return 'Generate Video';
      case 'analyzeVideo':
        return 'Analyze Video';
      case 'analyzeAudio':
        return 'Analyze Audio';
      case 'codeGeneration':
        return 'Code Generation';
      case 'codeExecution':
        return 'Code Execution';
      case 'functionCalling':
        return 'Function Calling';
      case 'groundingWithGoogleSearch':
        return 'Grounded Search';
      default:
        return 'Google Gemini';
    }
  };
  var getGeminiActionLevel = function (action) {
    var beginnerActions = ['generateText', 'sendChatMessage'];
    var intermediateActions = [
      'analyzeImage',
      'generateJson',
      'countTokens',
      'createEmbedding',
      'summarizeContent',
      'classifyText',
      'extractStructuredData',
      'translateText',
    ];
    var advancedActions = [
      'textToSpeech',
      'generateImage',
      'generateVideo',
      'analyzeVideo',
      'analyzeAudio',
      'codeGeneration',
      'codeExecution',
      'functionCalling',
      'groundingWithGoogleSearch',
    ];
    if (beginnerActions.includes(action || '')) return 'Beginner';
    if (intermediateActions.includes(action || '')) return 'Intermediate';
    if (advancedActions.includes(action || '')) return 'Advanced';
    return 'Beginner';
  };
  var updateNodeConfig = function (nodeId, configUpdates) {
    var updatedNodes = nodes.map(function (n) {
      if (n.id !== nodeId) return n;
      var newConfig = __assign(__assign({}, n.data.config), configUpdates);
      var updatedLabel = n.data.label;
      if (n.type === 'data-google-sheets' && configUpdates.action) {
        updatedLabel = 'Google Sheets \u2014 '.concat(
          formatGoogleSheetsActionLabel(configUpdates.action)
        );
      } else if (n.type === 'ai-gemini' && configUpdates.action) {
        updatedLabel = 'Gemini \u2014 '.concat(formatGeminiActionLabel(configUpdates.action));
      }
      var updatedData = __assign(__assign({}, n.data), {
        label: updatedLabel,
        config: __assign(__assign({}, newConfig), {
          isConfigured: isNodeConfigured(
            __assign(__assign({}, n), {
              data: __assign(__assign({}, n.data), { config: newConfig }),
            })
          ),
        }),
      });
      if (n.type === 'ai-gemini' && configUpdates.action) {
        updatedData.level = getGeminiActionLevel(configUpdates.action);
      }
      return __assign(__assign({}, n), { data: updatedData });
    });
    setNodes(updatedNodes);
  };
  (0, react_1.useEffect)(
    function () {
      if (typeof window === 'undefined' || oauthRedirectHandledRef.current) return;
      var params = new URLSearchParams(window.location.search);
      var oauthService = params.get('oauth_service');
      var oauthNodeId = params.get('oauth_node');
      if (!oauthService) return;
      var restoreServiceToken = function () {
        return __awaiter(_this, void 0, void 0, function () {
          var data, session, token, storedToken, targetNode, serviceTokens, error_1, cleanUrl;
          var _a;
          var _b;
          return __generator(this, function (_c) {
            switch (_c.label) {
              case 0:
                _c.trys.push([0, 2, 3, 4]);
                return [4 /*yield*/, supabaseClient_1.supabase.auth.getSession()];
              case 1:
                data = _c.sent().data;
                session = data === null || data === void 0 ? void 0 : data.session;
                token = session === null || session === void 0 ? void 0 : session.provider_token;
                if (token) {
                  storedToken = {
                    access_token: token,
                    timestamp: Date.now(),
                  };
                  window.localStorage.setItem(
                    'serviceToken:'.concat(oauthService),
                    JSON.stringify(storedToken)
                  );
                  if (oauthNodeId) {
                    targetNode = nodes.find(function (n) {
                      return n.id === oauthNodeId;
                    });
                    if (targetNode) {
                      serviceTokens = __assign(
                        __assign(
                          {},
                          ((_b = targetNode.data.config) === null || _b === void 0
                            ? void 0
                            : _b.serviceTokens) || {}
                        ),
                        ((_a = {}), (_a[oauthService] = storedToken), _a)
                      );
                      updateNodeConfig(oauthNodeId, { serviceTokens: serviceTokens });
                    }
                  }
                  setLog(function (prev) {
                    return __spreadArray(
                      __spreadArray([], prev, true),
                      ['Connected '.concat(oauthService, ' account successfully.')],
                      false
                    );
                  });
                }
                return [3 /*break*/, 4];
              case 2:
                error_1 = _c.sent();
                console.error('Failed to restore OAuth service token', error_1);
                return [3 /*break*/, 4];
              case 3:
                oauthRedirectHandledRef.current = true;
                params.delete('oauth_service');
                params.delete('oauth_node');
                cleanUrl = ''
                  .concat(window.location.pathname)
                  .concat(params.toString() ? '?'.concat(params.toString()) : '')
                  .concat(window.location.hash);
                window.history.replaceState({}, document.title, cleanUrl);
                return [7 /*endfinally*/];
              case 4:
                return [2 /*return*/];
            }
          });
        });
      };
      restoreServiceToken();
    },
    [nodes, setLog, updateNodeConfig]
  );
  var startVisualExecutionStepper = function (execOrder, executionId) {
    var currentIndex = 0;
    var stepThroughExecution = function () {
      if (currentIndex >= execOrder.length) {
        // All nodes have been visually stepped through
        setCurrentExecutingNodeId(null);
        return;
      }
      var nodeId = execOrder[currentIndex];
      var node = nodes.find(function (n) {
        return n.id === nodeId;
      });
      if (node) {
        // Set current node as executing
        setCurrentExecutingNodeId(nodeId);
        // Update node state to executing
        setNodes(
          nodes.map(function (n) {
            return n.id === nodeId
              ? __assign(__assign({}, n), {
                  data: __assign(__assign({}, n.data), { executionState: 'executing' }),
                })
              : n;
          })
        );
        setLog(function (prev) {
          var _a;
          return __spreadArray(
            __spreadArray([], prev, true),
            [
              'Executing node: '.concat(
                ((_a = node.data) === null || _a === void 0 ? void 0 : _a.label) || nodeId
              ),
            ],
            false
          );
        });
        // Simulate execution time (adjust based on node type)
        var executionTime = getNodeExecutionTime(node.type || '');
        setTimeout(function () {
          // Mark node as completed
          setNodes(
            nodes.map(function (n) {
              return n.id === nodeId
                ? __assign(__assign({}, n), {
                    data: __assign(__assign({}, n.data), { executionState: 'completed' }),
                  })
                : n;
            })
          );
          setLog(function (prev) {
            var _a;
            return __spreadArray(
              __spreadArray([], prev, true),
              [
                'Node completed: '.concat(
                  ((_a = node.data) === null || _a === void 0 ? void 0 : _a.label) || nodeId
                ),
              ],
              false
            );
          });
          currentIndex++;
          stepThroughExecution(); // Continue to next node
        }, executionTime);
      } else {
        currentIndex++;
        stepThroughExecution();
      }
    };
    // Start the visual stepping
    stepThroughExecution();
  };
  var getNodeExecutionTime = function (nodeType) {
    // Simulate different execution times based on node type
    var baseTime = 800; // Base execution time in ms
    switch (nodeType) {
      case 'aiNode':
        return baseTime * 2; // AI nodes take longer
      case 'toolNode':
        return baseTime * 1.5; // Tool nodes moderate time
      case 'logicNode':
        return baseTime * 0.5; // Logic nodes faster
      case 'memoryNode':
        return baseTime * 0.7; // Memory operations moderate
      case 'orchestrationNode':
        return baseTime * 1.2; // Orchestration moderate
      case 'humanNode':
        return baseTime * 3; // Human interaction longest
      default:
        return baseTime;
    }
  };
  var fetchExecutionStatus = function (executionIdToPoll) {
    return __awaiter(_this, void 0, void 0, function () {
      var sessionData, accessToken, _a, execution_1, error, error_2;
      var _b;
      return __generator(this, function (_c) {
        switch (_c.label) {
          case 0:
            _c.trys.push([0, 3, , 4]);
            return [4 /*yield*/, supabaseClient_1.supabase.auth.getSession()];
          case 1:
            sessionData = _c.sent().data;
            accessToken =
              (_b =
                sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) ===
                null || _b === void 0
                ? void 0
                : _b.access_token;
            if (!accessToken) {
              throw new Error('Unable to poll execution: user is not authenticated');
            }
            return [
              4 /*yield*/,
              supabaseClient_1.supabase
                .from('agent_executions')
                .select('*')
                .eq('id', executionIdToPoll)
                .single(),
            ];
          case 2:
            ((_a = _c.sent()), (execution_1 = _a.data), (error = _a.error));
            if (error) {
              throw error;
            }
            if (!execution_1) {
              throw new Error('Execution not found');
            }
            setExecutionStatus(execution_1.status);
            setExecutionResult(execution_1.output_data || execution_1.result || null);
            setExecutionError(execution_1.error_message || null);
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Execution '.concat(executionIdToPoll, ' status: ').concat(execution_1.status)],
                false
              );
            });
            if (execution_1.status === 'completed' || execution_1.status === 'failed') {
              setPollingExecution(false);
              setCurrentExecutingNodeId(null);
              // Reset all node execution states
              setNodes(
                nodes.map(function (node) {
                  return __assign(__assign({}, node), {
                    data: __assign(__assign({}, node.data), { executionState: null }),
                  });
                })
              );
            }
            return [3 /*break*/, 4];
          case 3:
            error_2 = _c.sent();
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                [
                  'Execution poll error: '.concat(
                    error_2 instanceof Error ? error_2.message : error_2
                  ),
                ],
                false
              );
            });
            return [3 /*break*/, 4];
          case 4:
            return [2 /*return*/];
        }
      });
    });
  };
  (0, react_1.useEffect)(
    function () {
      if (!executionId || !pollingExecution) return;
      var intervalId = window.setInterval(function () {
        fetchExecutionStatus(executionId);
      }, 2000);
      fetchExecutionStatus(executionId);
      return function () {
        return window.clearInterval(intervalId);
      };
    },
    [executionId, pollingExecution]
  );
  var computeExecOrder = function () {
    // Simple topological sort using Kahn's algorithm
    var inDegree = {};
    var graph = {};
    var queue = [];
    var result = [];
    // Initialize graph and in-degree
    nodes.forEach(function (node) {
      inDegree[node.id] = 0;
      graph[node.id] = [];
    });
    // Build graph and calculate in-degrees
    edges.forEach(function (edge) {
      if (graph[edge.source]) {
        graph[edge.source].push(edge.target);
        inDegree[edge.target] = (inDegree[edge.target] || 0) + 1;
      }
    });
    // Find nodes with no incoming edges
    nodes.forEach(function (node) {
      if (inDegree[node.id] === 0) {
        queue.push(node.id);
      }
    });
    // Process queue
    while (queue.length > 0) {
      var current = queue.shift();
      result.push(current);
      graph[current].forEach(function (neighbor) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      });
    }
    // If there are cycles, return all nodes in some order
    if (result.length !== nodes.length) {
      // Add remaining nodes (cycle detected)
      nodes.forEach(function (node) {
        if (!result.includes(node.id)) {
          result.push(node.id);
        }
      });
    }
    return result;
  };
  var sanitizeWorkflowForExecution = function (nodes, edges) {
    var sanitizedNodes = nodes.map(function (node) {
      var _a, _b;
      return {
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        config:
          (_b = (_a = node.data) === null || _a === void 0 ? void 0 : _a.config) !== null &&
          _b !== void 0
            ? _b
            : {},
      };
    });
    var sanitizedEdges = edges.map(function (edge) {
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle,
      };
    });
    return { sanitizedNodes: sanitizedNodes, sanitizedEdges: sanitizedEdges };
  };
  var executeWorkflow = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var execOrder,
        nodesWithResetState,
        validationErrors,
        message_1,
        _a,
        sanitizedNodes,
        sanitizedEdges,
        sessionData,
        accessToken,
        proposedExecutionId,
        socket,
        payload,
        response,
        responseBody,
        validationErrors_1,
        message_2,
        serverError,
        message,
        data,
        actualExecutionId_1,
        error_3,
        message_3;
      var _b, _c;
      return __generator(this, function (_d) {
        switch (_d.label) {
          case 0:
            setIsExecuting(true);
            setExecutionError(null);
            setExecutionResult(null);
            setExecutionStatus('queued');
            setCurrentExecutingNodeId(null);
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Starting workflow execution...'],
                false
              );
            });
            _d.label = 1;
          case 1:
            _d.trys.push([1, 5, 6, 7]);
            execOrder = computeExecOrder();
            nodesWithResetState = nodes.map(function (node) {
              return __assign(__assign({}, node), {
                data: __assign(__assign({}, node.data), { executionState: null }),
              });
            });
            setNodes(nodesWithResetState);
            validationErrors = validateWorkflowGraph(nodes, edges);
            if (validationErrors.length > 0) {
              message_1 = 'Invalid workflow graph: '.concat(validationErrors.join('; '));
              setExecutionError(message_1);
              setLog(function (prev) {
                return __spreadArray(__spreadArray([], prev, true), [message_1], false);
              });
              return [2 /*return*/];
            }
            ((_a = sanitizeWorkflowForExecution(nodes, edges)),
              (sanitizedNodes = _a.sanitizedNodes),
              (sanitizedEdges = _a.sanitizedEdges));
            return [4 /*yield*/, supabaseClient_1.supabase.auth.getSession()];
          case 2:
            sessionData = _d.sent().data;
            accessToken =
              (_b =
                sessionData === null || sessionData === void 0 ? void 0 : sessionData.session) ===
                null || _b === void 0
                ? void 0
                : _b.access_token;
            if (!accessToken) {
              throw new Error('Unable to run workflow: user is not authenticated');
            }
            proposedExecutionId = crypto.randomUUID();
            socket = (0, socket_client_1.getSharedSocket)();
            socket.emit('subscribe:execution', proposedExecutionId);
            payload = {
              agentId: undefined, // Always create new agent for execution to avoid ID conflicts
              agentName: workflowName || 'Unnamed Agent',
              nodes: sanitizedNodes,
              edges: sanitizedEdges,
              input: {},
              apiKeys: apiKeys,
              executionId: proposedExecutionId,
            };
            return [
              4 /*yield*/,
              fetch(''.concat(backendUrl, '/api/agent-run'), {
                method: 'POST',
                headers: {
                  Authorization: 'Bearer '.concat(accessToken),
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
              }),
            ];
          case 3:
            response = _d.sent();
            return [4 /*yield*/, parseResponseBody(response)];
          case 4:
            responseBody = _d.sent();
            if (!response.ok) {
              socket.emit('unsubscribe:execution', proposedExecutionId);
              if (
                responseBody &&
                typeof responseBody === 'object' &&
                Array.isArray(
                  (_c = responseBody.details) === null || _c === void 0 ? void 0 : _c.errors
                )
              ) {
                validationErrors_1 = responseBody.details.errors.filter(function (item) {
                  return typeof item === 'string';
                });
                if (validationErrors_1.length > 0) {
                  message_2 = 'Workflow validation failed: '.concat(validationErrors_1.join('; '));
                  setExecutionError(message_2);
                  setLog(function (prev) {
                    return __spreadArray(__spreadArray([], prev, true), [message_2], false);
                  });
                  applyValidationErrorsToNodes(validationErrors_1);
                  return [2 /*return*/];
                }
              }
              serverError =
                responseBody && typeof responseBody === 'object'
                  ? responseBody.error || responseBody.message || JSON.stringify(responseBody)
                  : String(responseBody || ''.concat(response.statusText));
              message = 'Agent execution request failed ('
                .concat(response.status, ' ')
                .concat(response.statusText, ') - ')
                .concat(serverError);
              throw new Error(message);
            }
            data = responseBody;
            actualExecutionId_1 = data === null || data === void 0 ? void 0 : data.executionId;
            if (!actualExecutionId_1) {
              socket.emit('unsubscribe:execution', proposedExecutionId);
              throw new Error(
                'Agent execution succeeded but no executionId returned. Response body: '.concat(
                  JSON.stringify(data)
                )
              );
            }
            if (actualExecutionId_1 !== proposedExecutionId) {
              socket.emit('unsubscribe:execution', proposedExecutionId);
              socket.emit('subscribe:execution', actualExecutionId_1);
            }
            setExecutionId(actualExecutionId_1);
            setExecutionStatus('queued');
            setCurrentExecutionId(actualExecutionId_1); // Set for socket updates
            setPollingExecution(false); // Disable polling since we use sockets
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Agent execution queued successfully: '.concat(actualExecutionId_1)],
                false
              );
            });
            if (data.reused) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Existing execution reused due to idempotency.'],
                  false
                );
              });
            }
            return [3 /*break*/, 7];
          case 5:
            error_3 = _d.sent();
            message_3 = formatErrorMessage(error_3);
            setExecutionError(message_3);
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Execution error: '.concat(message_3)],
                false
              );
            });
            return [3 /*break*/, 7];
          case 6:
            setIsExecuting(false);
            return [7 /*endfinally*/];
          case 7:
            return [2 /*return*/];
        }
      });
    });
  };
  (0, react_1.useEffect)(
    function () {
      if (!loading && user) {
        var checkAdmin = function () {
          return __awaiter(_this, void 0, void 0, function () {
            var _a, profile, error, error_4;
            return __generator(this, function (_b) {
              switch (_b.label) {
                case 0:
                  _b.trys.push([0, 2, , 3]);
                  console.log(
                    'Checking admin status for user:',
                    user === null || user === void 0 ? void 0 : user.id
                  );
                  return [
                    4 /*yield*/,
                    supabaseClient_1.supabase
                      .from('profiles')
                      .select('role')
                      .eq('id', user.id)
                      .single(),
                  ];
                case 1:
                  ((_a = _b.sent()), (profile = _a.data), (error = _a.error));
                  console.log('Admin check result:', {
                    profile: profile,
                    error: error,
                    role: profile === null || profile === void 0 ? void 0 : profile.role,
                  });
                  if (
                    !error &&
                    (profile === null || profile === void 0 ? void 0 : profile.role) === 'admin'
                  ) {
                    console.log('User is admin, setting isAdmin to true');
                    setIsAdmin(true);
                  } else {
                    console.log('User is not admin or error occurred');
                  }
                  return [3 /*break*/, 3];
                case 2:
                  error_4 = _b.sent();
                  console.error('Failed to verify admin role', error_4);
                  return [3 /*break*/, 3];
                case 3:
                  return [2 /*return*/];
              }
            });
          });
        };
        checkAdmin();
      }
    },
    [user, loading, router]
  );
  (0, react_1.useEffect)(function () {
    // Check if we should load a template from the templates page first
    var templateData = localStorage.getItem('load-template-data');
    var newWorkflowData = localStorage.getItem('new-workflow');
    if (templateData) {
      localStorage.removeItem('load-template-data'); // Clear it after loading
      setIsLoadingTemplate(true);
      // Small delay to show loading state
      setTimeout(function () {
        try {
          var template_1 = JSON.parse(templateData);
          setNodes(template_1.nodes || []);
          setEdges(template_1.edges || []);
          setWorkflowName(template_1.name || 'Loaded Template');
          setSelectedAgentId(null);
          setCurrentAgentStatus('draft');
          setLog(function (prev) {
            return __spreadArray(
              __spreadArray([], prev, true),
              ['Template "'.concat(template_1.name, '" loaded successfully')],
              false
            );
          });
          // Clear any existing saved workflow
          localStorage.removeItem('agent-builder-workflow');
        } catch (error) {
          console.error('Error loading template:', error);
          setLog(function (prev) {
            return __spreadArray(
              __spreadArray([], prev, true),
              ['Error loading template: Invalid template data'],
              false
            );
          });
        }
        setIsLoadingTemplate(false);
      }, 100);
    } else if (newWorkflowData) {
      localStorage.removeItem('new-workflow'); // Clear it after loading
      setIsLoadingTemplate(true);
      // Small delay to show loading state
      setTimeout(function () {
        try {
          var parsed_1 = JSON.parse(newWorkflowData);
          setNodes(parsed_1.nodes || []);
          setEdges(parsed_1.edges || []);
          setWorkflowName(parsed_1.name || 'New Workflow');
          setSelectedAgentId(null);
          setCurrentAgentStatus('draft');
          setLog(function (prev) {
            return __spreadArray(
              __spreadArray([], prev, true),
              ['New workflow "'.concat(parsed_1.name || 'Untitled', '" created successfully')],
              false
            );
          });
          // Clear any existing saved workflow
          localStorage.removeItem('agent-builder-workflow');
        } catch (e) {
          console.error('Invalid new workflow data', e);
          setLog(function (prev) {
            return __spreadArray(
              __spreadArray([], prev, true),
              ['Failed to create new workflow'],
              false
            );
          });
        }
        setIsLoadingTemplate(false);
      }, 100);
    } else {
      // No template to load, check for saved workflow
      var stored = localStorage.getItem('agent-builder-workflow');
      if (stored) {
        try {
          var parsed = JSON.parse(stored);
          setNodes(parsed.nodes || []);
          setEdges(parsed.edges || []);
          if (parsed.name) setWorkflowName(parsed.name);
          if (parsed.description) setAgentDescription(parsed.description);
          if (parsed.selectedAgentId) {
            setSelectedAgentId(parsed.selectedAgentId);
          }
          if (parsed.currentAgentStatus) {
            setCurrentAgentStatus(parsed.currentAgentStatus);
          }
        } catch (e) {
          console.error('Invalid saved workflow', e);
        }
      } else {
        // No saved workflow either, load default template
        var defaultTemplate_1 = agentBuilderTemplates_1.AgentBuilderTemplates.find(function (t) {
          return t.id === 'social-content-generator';
        });
        if (defaultTemplate_1) {
          setNodes(defaultTemplate_1.nodes);
          setEdges(defaultTemplate_1.edges);
          setWorkflowName(defaultTemplate_1.name);
          setLog(function (prev) {
            return __spreadArray(
              __spreadArray([], prev, true),
              ['Default template "'.concat(defaultTemplate_1.name, '" loaded')],
              false
            );
          });
        }
      }
    }
    var storedKeys = localStorage.getItem('agent-builder-api-keys');
    if (storedKeys) {
      try {
        var parsed = JSON.parse(storedKeys);
        setApiKeys({
          openai: parsed.openai || '',
          gemini: parsed.gemini || '',
          deepseek: parsed.deepseek || '',
          gmail: parsed.gmail || '',
        });
      } catch (e) {
        console.error('Invalid API keys', e);
      }
    }
  }, []);
  var onNodesChange = function (changes) {
    setNodes((0, reactflow_1.applyNodeChanges)(changes, nodes));
  };
  // Advanced: support edge removal via right-click
  var onEdgesChange = function (changes) {
    setEdges((0, reactflow_1.applyEdgeChanges)(changes, edges));
  };
  // Advanced: allow users to disconnect edges by right-clicking
  var onEdgeContextMenu = function (event, edge) {
    event.preventDefault();
    if (window.confirm('Remove this connection?')) {
      setEdges(
        edges.filter(function (e) {
          return e.id !== edge.id;
        })
      );
    }
  };
  // Advanced: highlight compatible ports on connect
  var _20 = (0, react_1.useState)(null),
    connectingNodeId = _20[0],
    setConnectingNodeId = _20[1];
  // React Flow's OnConnectStartParams: { nodeId: string | null; handleId: string | null; handleType: 'source' | 'target' | null }
  var onConnectStart = function (_event, params) {
    var _a;
    setConnectingNodeId((_a = params.nodeId) !== null && _a !== void 0 ? _a : null);
  };
  var onConnectEnd = function () {
    setConnectingNodeId(null);
  };
  var onConnect = function (connection) {
    setEdges((0, reactflow_1.addEdge)(connection, edges));
  };
  var onNodeClick = function (_event, node) {
    selectNode(node.id);
  };
  var onPaneClick = function () {
    selectNode(undefined);
  };
  var onPaneContextMenu = function (event) {
    event.preventDefault();
    setContextMenu({
      type: 'canvas',
      x: event.clientX,
      y: event.clientY,
    });
  };
  var onNodeContextMenu = function (event, node) {
    event.preventDefault();
    setContextMenu({
      type: 'node',
      id: node.id,
      x: event.clientX,
      y: event.clientY,
      data: node.data,
    });
  };
  // Group collapse/expand state
  var _21 = (0, react_1.useState)({}),
    collapsedGroups = _21[0],
    setCollapsedGroups = _21[1];
  var addNode = function (type) {
    var nodeType = nodeTypes_1.availableNodeTypes.find(function (t) {
      return t.id === type;
    });
    if (!nodeType) return;
    // If adding a group node, set as extent: 'parent'
    if (type === 'group') {
      var groupId = 'group-'.concat(Date.now());
      var newGroup = {
        id: groupId,
        type: 'group',
        position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
        data: {
          label: 'Group',
          description: 'Drag nodes here to group',
          collapsed: false,
          onToggleCollapse: function (id) {
            setCollapsedGroups(function (prev) {
              var _a;
              return __assign(__assign({}, prev), ((_a = {}), (_a[id] = !prev[id]), _a));
            });
            var updatedNodes = nodes.map(function (n) {
              return n.id === id
                ? __assign(__assign({}, n), {
                    data: __assign(__assign({}, n.data), { collapsed: !collapsedGroups[id] }),
                  })
                : n;
            });
            setNodes(updatedNodes);
          },
        },
        style: { zIndex: 1 },
        draggable: true,
        selectable: true,
        extent: 'parent',
      };
      setNodes(__spreadArray(__spreadArray([], nodes, true), [newGroup], false));
      return;
    }
    var newNode = {
      id: ''.concat(nodes.length + 1),
      type: nodeType.id,
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: {
        label: nodeType.label,
        config: {},
        icon: nodeType.icon,
      },
    };
    setNodes(__spreadArray(__spreadArray([], nodes, true), [newNode], false));
  };
  var loadTemplate = function (templateId) {
    var template = agentBuilderTemplates_1.AgentBuilderTemplates.find(function (t) {
      return t.id === templateId;
    });
    if (template) {
      setNodes(template.nodes);
      setEdges(template.edges);
      setWorkflowName(template.name);
      setSelectedAgentId(null);
      setAgentDescription('');
      setCurrentAgentStatus('draft');
      setLog(function (prev) {
        return __spreadArray(
          __spreadArray([], prev, true),
          ['Template "'.concat(template.name, '" loaded successfully')],
          false
        );
      });
    } else {
      setLog(function (prev) {
        return __spreadArray(
          __spreadArray([], prev, true),
          ['Template "'.concat(templateId, '" not found')],
          false
        );
      });
    }
  };
  var renderCredentialSelect = function (node, title) {
    var _a;
    var nodeType = node.type || '';
    var saved = credentials.filter(function (cred) {
      return (
        cred.provider === nodeType.replace('ai-', '') ||
        cred.provider === nodeType.replace('comm-', '').replace('-oauth2', '').replace('-bot', '')
      );
    });
    return (
      <div>
        <label_1.Label className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {title}
        </label_1.Label>
        <select_1.Select
          value={
            ((_a = node.data.config) === null || _a === void 0 ? void 0 : _a.credentialProvider) ||
            ''
          }
          onValueChange={function (value) {
            return updateNodeConfig(node.id, { credentialProvider: value });
          }}
        >
          <select_1.SelectTrigger className="mt-1 w-full">
            <select_1.SelectValue placeholder="Choose saved credential" />
          </select_1.SelectTrigger>
          <select_1.SelectContent>
            {saved.map(function (cred) {
              return (
                <select_1.SelectItem key={cred.id} value={cred.provider}>
                  {cred.label || cred.provider}
                </select_1.SelectItem>
              );
            })}
            <select_1.SelectItem value="">Manual / None</select_1.SelectItem>
          </select_1.SelectContent>
        </select_1.Select>
      </div>
    );
  };
  var saveAgentAsDraft = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var _a,
        profile,
        profileError,
        createError_1,
        agentStatus,
        agentPayload,
        error_5,
        _b,
        data,
        error_6;
      var _c, _d;
      return __generator(this, function (_e) {
        switch (_e.label) {
          case 0:
            if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.id)) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Cannot save: not signed in'],
                  false
                );
              });
              return [2 /*return*/];
            }
            return [
              4 /*yield*/,
              supabaseClient_1.supabase
                .from('profiles')
                .select('id')
                .eq('id', currentUser.id)
                .single(),
            ];
          case 1:
            ((_a = _e.sent()), (profile = _a.data), (profileError = _a.error));
            if (profileError && profileError.code !== 'PGRST116') {
              // PGRST116 is "not found"
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Failed to check profile: '.concat(profileError.message)],
                  false
                );
              });
              return [2 /*return*/];
            }
            if (!!profile) return [3 /*break*/, 3];
            return [
              4 /*yield*/,
              supabaseClient_1.supabase.from('profiles').insert({
                id: currentUser.id,
                email: currentUser.email,
                full_name:
                  ((_c = currentUser.user_metadata) === null || _c === void 0
                    ? void 0
                    : _c.full_name) || '',
                avatar_url:
                  ((_d = currentUser.user_metadata) === null || _d === void 0
                    ? void 0
                    : _d.avatar_url) || '',
              }),
            ];
          case 2:
            createError_1 = _e.sent().error;
            if (createError_1) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Failed to create profile: '.concat(createError_1.message)],
                  false
                );
              });
              return [2 /*return*/];
            }
            _e.label = 3;
          case 3:
            agentStatus = selectedAgentId && currentAgentStatus === 'active' ? 'active' : 'draft';
            agentPayload = {
              user_id: currentUser.id,
              name: workflowName || 'Untitled Agent',
              description: agentDescription,
              config: { nodes: nodes, edges: edges },
              status: agentStatus,
              version: '1.0.0',
            };
            if (!selectedAgentId) return [3 /*break*/, 5];
            return [
              4 /*yield*/,
              supabaseClient_1.supabase
                .from('user_agents')
                .update(agentPayload)
                .eq('id', selectedAgentId),
            ];
          case 4:
            error_5 = _e.sent().error;
            if (error_5) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Failed to update agent: '.concat(error_5.message)],
                  false
                );
              });
              return [2 /*return*/];
            }
            localStorage.setItem(
              'agent-builder-workflow',
              JSON.stringify({
                nodes: nodes,
                edges: edges,
                name: workflowName,
                description: agentDescription,
                selectedAgentId: selectedAgentId,
                currentAgentStatus: agentStatus,
              })
            );
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Agent updated: '.concat(workflowName)],
                false
              );
            });
            return [3 /*break*/, 7];
          case 5:
            return [
              4 /*yield*/,
              supabaseClient_1.supabase
                .from('user_agents')
                .insert(agentPayload)
                .select('id')
                .single(),
            ];
          case 6:
            ((_b = _e.sent()), (data = _b.data), (error_6 = _b.error));
            if (error_6 || !data) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  [
                    'Failed to save draft: '.concat(
                      (error_6 === null || error_6 === void 0 ? void 0 : error_6.message) ||
                        'unknown'
                    ),
                  ],
                  false
                );
              });
              return [2 /*return*/];
            }
            setSelectedAgentId(data.id);
            localStorage.setItem(
              'agent-builder-workflow',
              JSON.stringify({
                nodes: nodes,
                edges: edges,
                name: workflowName,
                description: agentDescription,
                selectedAgentId: data.id,
                currentAgentStatus: agentStatus,
              })
            );
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Draft saved: '.concat(workflowName)],
                false
              );
            });
            _e.label = 7;
          case 7:
            setCurrentAgentStatus(agentStatus);
            return [4 /*yield*/, loadUserAgents()];
          case 8:
            _e.sent();
            return [2 /*return*/];
        }
      });
    });
  };
  var openSaveAsTemplateDialog = function () {
    if (!isAdmin) {
      setLog(function (prev) {
        return __spreadArray(
          __spreadArray([], prev, true),
          ['Save as template is available only to admin users.'],
          false
        );
      });
      return;
    }
    setTemplateForm(function (prev) {
      return __assign(__assign({}, prev), {
        name: workflowName || prev.name || 'Untitled Agent Workflow',
        description: agentDescription || prev.description,
      });
    });
    setShowTemplateDialog(true);
  };
  var saveCurrentWorkflowAsTemplate = function () {
    return __awaiter(_this, void 0, void 0, function () {
      var sessionData, token, templatePayload_1, response_1, errorData, error_7, message_4;
      var _a;
      return __generator(this, function (_b) {
        switch (_b.label) {
          case 0:
            if (!isAdmin || !user) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Unable to save template: admin access required.'],
                  false
                );
              });
              return [2 /*return*/];
            }
            if (
              !(workflowName === null || workflowName === void 0 ? void 0 : workflowName.trim())
            ) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Please give your workflow a name before saving as a template.'],
                  false
                );
              });
              return [2 /*return*/];
            }
            if (!nodes || nodes.length === 0) {
              setLog(function (prev) {
                return __spreadArray(
                  __spreadArray([], prev, true),
                  ['Cannot save empty workflow as template. Please add some nodes first.'],
                  false
                );
              });
              return [2 /*return*/];
            }
            setSavingTemplate(true);
            _b.label = 1;
          case 1:
            _b.trys.push([1, 6, 7, 8]);
            return [4 /*yield*/, supabaseClient_1.supabase.auth.getSession()];
          case 2:
            sessionData = _b.sent().data;
            token = (_a = sessionData.session) === null || _a === void 0 ? void 0 : _a.access_token;
            if (!token) {
              throw new Error('Authentication required');
            }
            templatePayload_1 = {
              name: templateForm.name.trim() || workflowName.trim(),
              description:
                templateForm.description.trim() ||
                agentDescription.trim() ||
                'An admin-created agentic workflow template.',
              category: templateForm.category || 'Agentic Workflow',
              config: {
                nodes: nodes,
                edges: edges,
              },
              ui_schema: null,
              is_public: templateForm.is_public,
              version: templateForm.version,
            };
            return [
              4 /*yield*/,
              fetch('/api/admin/templates', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: 'Bearer '.concat(token),
                },
                body: JSON.stringify(templatePayload_1),
              }),
            ];
          case 3:
            response_1 = _b.sent();
            if (!!response_1.ok) return [3 /*break*/, 5];
            return [
              4 /*yield*/,
              response_1.json().catch(function () {
                return { error: 'Unknown error', status: response_1.status };
              }),
            ];
          case 4:
            errorData = _b.sent();
            console.error(
              'Template save failed:',
              errorData.error ||
                errorData.message ||
                'HTTP '.concat(response_1.status, ': ').concat(response_1.statusText)
            );
            console.error('Full error details:', {
              status: response_1.status,
              statusText: response_1.statusText,
              errorData: errorData,
              token: token ? 'present' : 'missing',
              userId: user === null || user === void 0 ? void 0 : user.id,
            });
            throw new Error(
              errorData.error ||
                errorData.message ||
                'HTTP '.concat(response_1.status, ': ').concat(response_1.statusText)
            );
          case 5:
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Template saved successfully: '.concat(templatePayload_1.name)],
                false
              );
            });
            setShowTemplateDialog(false);
            return [3 /*break*/, 8];
          case 6:
            error_7 = _b.sent();
            message_4 = error_7 instanceof Error ? error_7.message : 'Unknown error';
            setLog(function (prev) {
              return __spreadArray(
                __spreadArray([], prev, true),
                ['Failed to save template: '.concat(message_4)],
                false
              );
            });
            console.error('Template save error details:', {
              error: error_7,
              message: message_4,
              userId: user === null || user === void 0 ? void 0 : user.id,
              isAdmin: isAdmin,
              workflowName: workflowName,
              templateForm: templateForm,
            });
            return [3 /*break*/, 8];
          case 7:
            setSavingTemplate(false);
            return [7 /*endfinally*/];
          case 8:
            return [2 /*return*/];
        }
      });
    });
  };
  var executeWorkflowHandler = function () {
    return __awaiter(_this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: implement workflow execution
        setLog(function (prev) {
          return __spreadArray(
            __spreadArray([], prev, true),
            ['Workflow execution started'],
            false
          );
        });
        return [2 /*return*/];
      });
    });
  };
  var createNewAgentWorkflowHandler = function () {
    // TODO: implement creating new workflow
    reset();
    setWorkflowName('Untitled Agent Workflow');
    setLog(function (prev) {
      return __spreadArray(__spreadArray([], prev, true), ['New workflow created'], false);
    });
  };
  var publishAgentHandler = function () {
    return __awaiter(_this, void 0, void 0, function () {
      return __generator(this, function (_a) {
        // TODO: implement publishing agent
        setLog(function (prev) {
          return __spreadArray(__spreadArray([], prev, true), ['Agent published'], false);
        });
        return [2 /*return*/];
      });
    });
  };
  var resetHandler = function () {
    // TODO: implement reset
    setNodes([]);
    setEdges([]);
    setLog(function (prev) {
      return __spreadArray(__spreadArray([], prev, true), ['Workflow reset'], false);
    });
  };
  return (
    <div className="h-screen flex bg-[var(--bg-page)] text-[var(--text-primary)]">
      <AgentBuilderSidebar_1.AgentBuilderSidebar
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeSection === 'builder' && (
          <>
            <ExecutionControls_1.ExecutionControls
              workflowName={workflowName}
              setWorkflowName={setWorkflowName}
              currentAgentStatus={currentAgentStatus}
              executionStatus={executionStatus}
              currentExecutionId={currentExecutionId}
              executionError={executionError}
              showNodePalette={showNodePalette}
              setShowNodePalette={setShowNodePalette}
              saveAgentAsDraft={saveAgentAsDraft}
              executeWorkflow={executeWorkflow}
              createNewAgentWorkflow={createNewAgentWorkflow}
              publishAgent={publishAgent}
              openSaveAsTemplateDialog={openSaveAsTemplateDialog}
              isAdmin={isAdmin}
              reset={reset}
              isExecuting={isExecuting}
              selectedAgentType={selectedAgentType}
              setSelectedAgentType={setSelectedAgentType}
            />

            <dialog_1.Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <dialog_1.DialogContent className="max-w-2xl">
                <dialog_1.DialogHeader>
                  <dialog_1.DialogTitle>Save Workflow as Template</dialog_1.DialogTitle>
                </dialog_1.DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <label_1.Label htmlFor="template-name">Template Name</label_1.Label>
                    <input_1.Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={function (e) {
                        return setTemplateForm(function (prev) {
                          return __assign(__assign({}, prev), { name: e.target.value });
                        });
                      }}
                      placeholder="Agentic workflow template name"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label_1.Label htmlFor="template-description">Description</label_1.Label>
                    <textarea_1.Textarea
                      id="template-description"
                      value={templateForm.description}
                      onChange={function (e) {
                        return setTemplateForm(function (prev) {
                          return __assign(__assign({}, prev), { description: e.target.value });
                        });
                      }}
                      placeholder="Brief description of the workflow template"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label_1.Label htmlFor="template-category">Category</label_1.Label>
                      <select_1.Select
                        value={templateForm.category}
                        onValueChange={function (value) {
                          return setTemplateForm(function (prev) {
                            return __assign(__assign({}, prev), { category: value });
                          });
                        }}
                      >
                        <select_1.SelectTrigger className="w-full">
                          <select_1.SelectValue placeholder="Select category" />
                        </select_1.SelectTrigger>
                        <select_1.SelectContent>
                          {templateCategories.map(function (category) {
                            return (
                              <select_1.SelectItem key={category} value={category}>
                                {category}
                              </select_1.SelectItem>
                            );
                          })}
                        </select_1.SelectContent>
                      </select_1.Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <checkbox_1.Checkbox
                        id="template-public"
                        checked={templateForm.is_public}
                        onCheckedChange={function (checked) {
                          return setTemplateForm(function (prev) {
                            return __assign(__assign({}, prev), { is_public: checked });
                          });
                        }}
                      />
                      <label_1.Label htmlFor="template-public">Public template</label_1.Label>
                    </div>
                  </div>
                </div>
                <dialog_1.DialogFooter>
                  <button_1.Button
                    variant="outline"
                    onClick={function () {
                      return setShowTemplateDialog(false);
                    }}
                  >
                    Cancel
                  </button_1.Button>
                  <button_1.Button
                    onClick={saveCurrentWorkflowAsTemplate}
                    disabled={savingTemplate}
                  >
                    {savingTemplate ? 'Saving...' : 'Save Template'}
                  </button_1.Button>
                </dialog_1.DialogFooter>
              </dialog_1.DialogContent>
            </dialog_1.Dialog>

            <AgentBuilderCanvas_1.AgentBuilderCanvas
              activeSection={activeSection}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onConnectStart={onConnectStart}
              onConnectEnd={onConnectEnd}
              onNodeClick={onNodeClick}
              onNodeDoubleClick={onNodeDoubleClick}
              onPaneClick={onPaneClick}
              onPaneContextMenu={onPaneContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              onEdgeContextMenu={onEdgeContextMenu}
              filteredEdgeIds={filteredEdgeIds}
              workflows={workflows}
              setNodes={setNodes}
              setEdges={setEdges}
              setWorkflowName={setWorkflowName}
              setActiveSection={setActiveSection}
              setLog={setLog}
            />

            <NodeManagement_1.NodeManagement
              activeSection={activeSection}
              showNodePalette={showNodePalette}
              setShowNodePalette={setShowNodePalette}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              nodePalettePosition={nodePalettePosition}
              settingsPosition={settingsPosition}
              nodeConfigPosition={nodeConfigPosition}
              draggingPane={draggingPane}
              setDraggingPane={setDraggingPane}
              dragOffset={dragOffset}
              setDragOffset={setDragOffset}
              selectedNode={selectedNode}
              selectedNodeId={
                selectedNodeId !== null && selectedNodeId !== void 0 ? selectedNodeId : null
              }
              nodes={nodes}
              edges={edges}
              credentials={credentials}
              credentialForm={credentialForm}
              setCredentialForm={setCredentialForm}
              loadCredentials={loadCredentials}
              loadCredentialIntoNode={loadCredentialIntoNode}
              updateNodeConfig={updateNodeConfig}
              apiKeys={apiKeys}
              setApiKeys={setApiKeys}
              saveApiKeys={saveApiKeys}
              renderIcon={renderIcon}
              selectNode={selectNode}
              copyConfig={copyConfig}
              duplicateNode={duplicateNode}
              duplicateEdge={duplicateEdge}
              undo={undoHandler}
              redo={redoHandler}
              setContextMenu={setContextMenu}
              contextMenu={contextMenu}
              setNodes={setNodes}
              setEdges={setEdges}
              setActiveSection={setActiveSection}
              setLog={setLog}
              nodeTypeCategory={nodeTypeCategory}
              isNodeConfigured={isNodeConfigured}
            />

            <AgentBuilderLogPanel_1.AgentBuilderLogPanel
              showLogPanel={showLogPanel}
              setShowLogPanel={setShowLogPanel}
              log={log}
            />
          </>
        )}

        {activeSection === 'dashboard' && (
          <AgentBuilderDashboard_1.AgentBuilderDashboard
            user={user}
            workflows={workflows}
            userAgents={userAgents}
            executionStatuses={executionStatuses}
            draftUserAgents={draftUserAgents}
            activeUserAgents={activeUserAgents}
            loadUserAgent={loadUserAgent}
            createNewAgentWorkflow={createNewAgentWorkflow}
            exportDashboardReport={exportDashboardReport}
            clearExecutions={clearExecutions}
            setActiveSection={setActiveSection}
            exportAgentJson={exportAgentJson}
            deleteAgent={deleteAgent}
          />
        )}

        {activeSection === 'templates' && (
          <AgentBuilderTemplates_1.AgentBuilderTemplates
            filteredTemplates={filteredTemplates}
            templateSearchQuery={templateSearchQuery}
            setTemplateSearchQuery={setTemplateSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            loadTemplate={loadTemplate}
            setActiveSection={setActiveSection}
            renderIcon={renderIcon}
            setLog={setLog}
          />
        )}

        {activeSection === 'webhooks' && (
          <div className="flex-1 p-6">
            <webhook_manager_1.WebhookManager workflows={workflows} />
          </div>
        )}

        {activeSection === 'vault' && (
          <AgentBuilderVault_1.AgentBuilderVault
            credentials={credentials}
            credentialForm={credentialForm}
            setCredentialForm={setCredentialForm}
            createCredential={createCredential}
          />
        )}

        {activeSection === 'settings' && (
          <AgentBuilderSettings_1.AgentBuilderSettings
            apiKeys={apiKeys}
            setApiKeys={setApiKeys}
            saveApiKeys={saveApiKeys}
            showNodePalette={showNodePalette}
            setShowNodePalette={setShowNodePalette}
          />
        )}
      </div>
    </div>
  );
}
