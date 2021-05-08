module.exports = class Graphql {
    constructor(resolvers = {}) {
        this.resolvers = resolvers || {};
    }
    parseQuery(query = "") {
        query = query.trim();
        if (query.startsWith("{") && query.endsWith("}")) {
            query = query.slice(1, -1).trim();
            query.replace(/\w+\s*\{(.|\n)+\}/g, () => '');
            return;
        }
        const parsed = {
            type: "query",
            name: "noName",
            expectedVars: {},
            queries: []
        }
        query = query.replace(/^\w+\s+/, type => {
            parsed.type = type.trim();
            return '';
        });
        query = query.replace(/^\w+\s*/, name => {
            parsed.name = name.trim();
            return '';
        });
        query = query.replace(/^\(.+\)\s*/, params => {
            let expectedVars = params.trim().slice(1, -1).trim();
            expectedVars = expectedVars.split(',').map(v => v.split(/:\s*/).map((e, i) => i ? e.trim() : e.trim().replace(/^\$/, '')));
            parsed.expectedVars = Object.fromEntries(expectedVars);
            return '';
        });
        query = query.replace(/(^{)|(}$)/g, '').trim();
        query.replace(/\w+\s*(\(.+\))?\s*\{((\s*\w+\s*)+)\}/g, (matched, a, body) => {
            const p = this.parseQuery(matched.trim());
            p.body = body.split(/\s+/).filter(Boolean);
            parsed.queries.push(p);
        });
        return parsed;
    }
    runQuery(query = "", variables = {}) {
        const q = this.parseQuery(query);
        const vars = {};
        for (const [varName, type] of Object.entries(q.expectedVars)) {
            const isRequired = type.endsWith('!');
            if (typeof variables[varName] !== "undefined") {
                vars[varName] = type;
            } else if (isRequired) {
                throw Error(`${varName} is required!`);
            }
        }
        // console.log(q);
        // console.log(util.inspect(q, true, null, true));
        for (const qq of q.queries) {
            const resolver = this.resolvers[qq.type][qq.name];
            if (resolver) {
                let vars = Object
                    .entries({ ...qq.expectedVars })
                    .map(([k, v]) => ([k, variables[v.replace(/^[$]/, '')]]));
                vars = Object.fromEntries(vars);
                const result = resolver({ ...qq, variables: vars });
                if (qq.body.indexOf('__all') === -1) {
                    for (const key in result) {
                        if (qq.body.indexOf(key) === -1) {
                            delete result[key];
                        }
                    }
                }
                qq.return = result;
            }
        }
        const returnValue = {};
        for (const qq of q.queries) {
            returnValue[qq.name] = qq.return || null;
        }
        console.log(returnValue);
    }
}