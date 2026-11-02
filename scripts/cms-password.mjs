import { hashPassword } from "../server/cms.mjs";
// Read from standard input so the password never needs to appear in command arguments.
let input = "";
for await (const chunk of process.stdin) input += chunk;
const password = input.trimEnd();
if (password.length < 14) {
  console.error(
    "密码至少14个字符。通过标准输入传入，不要把真实密码发到聊天或提交到仓库。",
  );
  process.exit(1);
}
console.log(hashPassword(password));
