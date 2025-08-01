(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/mocks/handlers.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// DEV-ONLY: MSW handlers for API mocking. Expand as needed for more endpoints.
__turbopack_context__.s({
    "handlers": ()=>handlers
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/msw/lib/core/http.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/msw/lib/core/HttpResponse.mjs [app-client] (ecmascript)");
;
const handlers = [
    // Mock profile/me endpoint
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].get('/api/me', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            id: 1,
            firstName: 'Dev',
            lastName: 'User',
            email: 'dev@example.com',
            role: 'COACH'
        });
    }),
    // Mock event types
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].get('/api/eventTypes', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                {
                    id: 1,
                    name: 'Practice',
                    color: '#2196f3',
                    txtColor: '#fff'
                },
                {
                    id: 2,
                    name: 'Game',
                    color: '#4ecdc4',
                    txtColor: '#fff'
                },
                {
                    id: 3,
                    name: 'Meeting',
                    color: '#4caf50',
                    txtColor: '#fff'
                }
            ]
        });
    }),
    // Mock events
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].get('/api/events', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                {
                    id: 1,
                    name: 'Eagles vs Hawks',
                    startTime: '2025-03-15T19:00:00Z',
                    endTime: '2025-03-15T21:00:00Z',
                    eventType: {
                        id: 2,
                        name: 'Game',
                        color: '#4ecdc4',
                        txtColor: '#fff'
                    },
                    location: 'HOME',
                    venue: 'Home Court',
                    isRepeat: false
                },
                {
                    id: 2,
                    name: 'Practice Session',
                    startTime: '2025-03-12T16:00:00Z',
                    endTime: '2025-03-12T18:00:00Z',
                    eventType: {
                        id: 1,
                        name: 'Practice',
                        color: '#2196f3',
                        txtColor: '#fff'
                    },
                    location: 'HOME',
                    venue: 'Training Ground',
                    isRepeat: false
                }
            ],
            meta: {
                total: 2,
                page: 1,
                perPage: 20
            }
        });
    }),
    // Mock event players
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].get('/api/events/:id/players', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                {
                    id: 1,
                    name: 'Player One',
                    position: {
                        id: 1,
                        name: 'Forward'
                    }
                },
                {
                    id: 2,
                    name: 'Player Two',
                    position: {
                        id: 2,
                        name: 'Goalkeeper'
                    }
                },
                {
                    id: 3,
                    name: 'Player Three',
                    position: {
                        id: 3,
                        name: 'Defender'
                    }
                }
            ]
        });
    }),
    // Mock profile
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].get('/api/profile', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            id: 1,
            firstName: 'Dev',
            lastName: 'User',
            email: 'dev@example.com',
            role: 'COACH'
        });
    }),
    // Mock players
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].get('/api/players', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                {
                    id: 1,
                    name: 'Player One',
                    position: {
                        id: 1,
                        name: 'Forward'
                    },
                    jersey: '10',
                    height: 180
                },
                {
                    id: 2,
                    name: 'Player Two',
                    position: {
                        id: 2,
                        name: 'Goalkeeper'
                    },
                    jersey: '1',
                    height: 185
                },
                {
                    id: 3,
                    name: 'Player Three',
                    position: {
                        id: 3,
                        name: 'Defender'
                    },
                    jersey: '5',
                    height: 178
                }
            ],
            meta: {
                total: 3,
                page: 1,
                perPage: 20
            }
        });
    }),
    // Mock positions
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].get('/api/positions', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                {
                    id: 1,
                    name: 'Forward'
                },
                {
                    id: 2,
                    name: 'Goalkeeper'
                },
                {
                    id: 3,
                    name: 'Defender'
                },
                {
                    id: 4,
                    name: 'Midfielder'
                }
            ]
        });
    }),
    // Mock tasks with eventId support
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].get('/api/tasks', (param)=>{
        let { request } = param;
        const url = new URL(request.url);
        const eventId = url.searchParams.get('eventId');
        const status = url.searchParams.get('status');
        const priorityId = url.searchParams.get('priorityId');
        // Mock tasks for game event (eventId = 1)
        const gameTasks = [
            {
                id: 1,
                name: 'Set up equipment',
                description: 'Prepare court and equipment for the game',
                dueDate: '2025-03-15',
                priority: {
                    id: 1,
                    name: 'High',
                    weight: 1
                },
                status: 'TODO',
                eventId: 1,
                event: {
                    id: 1,
                    name: 'Eagles vs Hawks',
                    venue: 'Home Court'
                },
                playerTasks: [
                    {
                        player: {
                            id: 1,
                            name: 'Player One'
                        }
                    }
                ]
            },
            {
                id: 2,
                name: 'Team warm-up',
                description: 'Complete pre-game warm-up routine',
                dueDate: '2025-03-15',
                priority: {
                    id: 2,
                    name: 'Medium',
                    weight: 2
                },
                status: 'IN_PROGRESS',
                eventId: 1,
                event: {
                    id: 1,
                    name: 'Eagles vs Hawks',
                    venue: 'Home Court'
                },
                playerTasks: [
                    {
                        player: {
                            id: 1,
                            name: 'Player One'
                        }
                    },
                    {
                        player: {
                            id: 2,
                            name: 'Player Two'
                        }
                    }
                ]
            },
            {
                id: 3,
                name: 'Review game plan',
                description: 'Final review of strategies and plays',
                dueDate: '2025-03-15',
                priority: {
                    id: 1,
                    name: 'High',
                    weight: 1
                },
                status: 'DONE',
                eventId: 1,
                event: {
                    id: 1,
                    name: 'Eagles vs Hawks',
                    venue: 'Home Court'
                },
                playerTasks: []
            },
            {
                id: 4,
                name: 'Check uniforms',
                description: 'Ensure all players have proper uniforms',
                dueDate: '2025-03-15',
                priority: {
                    id: 2,
                    name: 'Medium',
                    weight: 2
                },
                status: 'TODO',
                eventId: 1,
                event: {
                    id: 1,
                    name: 'Eagles vs Hawks',
                    venue: 'Home Court'
                },
                playerTasks: [
                    {
                        player: {
                            id: 3,
                            name: 'Player Three'
                        }
                    }
                ]
            }
        ];
        // General tasks not tied to events
        const generalTasks = [
            {
                id: 5,
                name: 'Update player stats',
                description: 'Update season statistics',
                dueDate: '2025-03-20',
                priority: {
                    id: 3,
                    name: 'Low',
                    weight: 3
                },
                status: 'TODO',
                eventId: null,
                event: null,
                playerTasks: []
            }
        ];
        let tasks = [
            ...gameTasks,
            ...generalTasks
        ];
        // Filter by eventId if provided
        if (eventId) {
            tasks = tasks.filter((task)=>task.eventId === parseInt(eventId));
        }
        // Filter by status if provided
        if (status) {
            tasks = tasks.filter((task)=>task.status === status);
        }
        // Filter by priorityId if provided
        if (priorityId) {
            tasks = tasks.filter((task)=>task.priority.id === parseInt(priorityId));
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: tasks,
            meta: {
                total: tasks.length,
                page: 1,
                perPage: 20
            }
        });
    }),
    // Mock priorities
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].get('/api/priorities', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                {
                    id: 1,
                    name: 'High',
                    weight: 1
                },
                {
                    id: 2,
                    name: 'Medium',
                    weight: 2
                },
                {
                    id: 3,
                    name: 'Low',
                    weight: 3
                }
            ]
        });
    }),
    // Mock login
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["http"].post('/api/login', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            token: 'dev-token'
        });
    })
];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/mocks/browser.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
// DEV-ONLY: MSW browser setup for API mocking.
__turbopack_context__.s({
    "worker": ()=>worker
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$browser$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/msw/lib/browser/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$mocks$2f$handlers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/mocks/handlers.ts [app-client] (ecmascript)");
;
;
const worker = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$browser$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setupWorker"])(...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$mocks$2f$handlers$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["handlers"]);
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_mocks_fd2e294a._.js.map