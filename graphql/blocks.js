const util = require('util');
const lines = require("./blocks.json");
const Graphql = require('./Graphql');

// console.log(lines);

const client = new Graphql({
    query: {
        getLine({ variables }) {
            const { lineId } = variables;
            return lines.find(line => line._id === lineId);
        }
    }
});

client.runQuery(`
query myQuery($lineId: string!) {
    getLine(lineId: $lineId){
        _id
        __all
    }
}
`, { lineId: "vgle5z2fwp" });
