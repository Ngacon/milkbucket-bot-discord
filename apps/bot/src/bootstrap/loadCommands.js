const fs = require("fs");
const path = require("path");

function walk(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });

  return entries.flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }

    return entry.name.endsWith(".js") && !entry.name.startsWith("_") ? [fullPath] : [];
  });
}

function loadCommands(commandsDir) {
  const commands = new Map();

  for (const file of walk(commandsDir)) {
    const exported = require(file);
    const commandList = Array.isArray(exported) ? exported : [exported];

    for (const command of commandList) {
      if (!command || !command.name || typeof command.execute !== "function") {
        throw new Error(`Invalid command module at ${file}`);
      }

      if (commands.has(command.name)) {
        throw new Error(`Duplicate command name \`${command.name}\` from ${file}`);
      }

      commands.set(command.name, command);
    }
  }

  return commands;
}

module.exports = { loadCommands };
