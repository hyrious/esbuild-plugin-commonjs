import { Lexer } from "./lexer";

let lexer = new Lexer();

console.log([
  lexer.readString(`"fs"`, 0),
  lexer.readString(`'os'`, 0),
  lexer.readString(`require("react"`, 8),
  lexer.readString(`require("react`, 8),
  lexer.readString(`require(\`react\``, 8),
]);
