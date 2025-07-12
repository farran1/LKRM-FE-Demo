module.exports = {

"[project]/src/mocks/handlers.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// DEV-ONLY: MSW handlers for API mocking. Expand as needed for more endpoints.
__turbopack_context__.s({
    "handlers": (()=>handlers)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/msw/lib/core/http.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/msw/lib/core/HttpResponse.mjs [app-rsc] (ecmascript)");
;
const handlers = [
    // Mock profile/me endpoint
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["http"].get('/api/me', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            id: 1,
            firstName: 'Dev',
            lastName: 'User',
            email: 'dev@example.com',
            role: 'COACH'
        });
    }),
    // Mock event types
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["http"].get('/api/eventTypes', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HttpResponse"].json({
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
                    color: '#f44336',
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
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["http"].get('/api/events', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                {
                    id: 1,
                    name: 'Practice 1',
                    startTime: '2024-07-10T10:00:00Z',
                    endTime: '2024-07-10T12:00:00Z',
                    eventType: {
                        id: 1,
                        name: 'Practice',
                        color: '#2196f3',
                        txtColor: '#fff'
                    },
                    location: 'HOME',
                    venue: 'Main Field'
                },
                {
                    id: 2,
                    name: 'Game 1',
                    startTime: '2024-07-12T15:00:00Z',
                    endTime: '2024-07-12T17:00:00Z',
                    eventType: {
                        id: 2,
                        name: 'Game',
                        color: '#f44336',
                        txtColor: '#fff'
                    },
                    location: 'AWAY',
                    venue: 'Stadium'
                }
            ],
            meta: {
                total: 2,
                page: 1,
                perPage: 20
            }
        });
    }),
    // Mock profile
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["http"].get('/api/profile', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            id: 1,
            firstName: 'Dev',
            lastName: 'User',
            email: 'dev@example.com',
            role: 'COACH'
        });
    }),
    // Mock players
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["http"].get('/api/players', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                {
                    id: 1,
                    name: 'Player One',
                    position: {
                        id: 1,
                        name: 'Forward'
                    },
                    jersey: '10',
                    weight: 75,
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
                    weight: 80,
                    height: 185
                }
            ],
            meta: {
                total: 2,
                page: 1,
                perPage: 20
            }
        });
    }),
    // Mock tasks
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["http"].get('/api/tasks', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            data: [
                {
                    id: 1,
                    name: 'Task 1',
                    dueDate: '2024-07-15',
                    priority: {
                        id: 1,
                        weight: 1
                    },
                    status: 'TODO'
                },
                {
                    id: 2,
                    name: 'Task 2',
                    dueDate: '2024-07-20',
                    priority: {
                        id: 2,
                        weight: 2
                    },
                    status: 'IN_PROGRESS'
                }
            ],
            meta: {
                total: 2,
                page: 1,
                perPage: 20
            }
        });
    }),
    // Mock login
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$http$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["http"].post('/api/login', ()=>{
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$core$2f$HttpResponse$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HttpResponse"].json({
            token: 'dev-token'
        });
    })
];
}}),
"[project]/src/mocks/browser.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// DEV-ONLY: MSW browser setup for API mocking.
__turbopack_context__.s({
    "worker": (()=>worker)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$browser$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/msw/lib/browser/index.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$mocks$2f$handlers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/mocks/handlers.ts [app-rsc] (ecmascript)");
;
;
const worker = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$msw$2f$lib$2f$browser$2f$index$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["setupWorker"])(...__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$mocks$2f$handlers$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["handlers"]);
}}),
"[project]/src/mocks/index.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
// DEV-ONLY: MSW entry point to start the worker in development mode.
__turbopack_context__.s({});
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$mocks$2f$browser$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/mocks/browser.ts [app-rsc] (ecmascript)");
;
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
}
}}),

};

//# sourceMappingURL=src_mocks_9f31065c._.js.map