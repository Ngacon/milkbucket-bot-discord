class AliasResolver {
  constructor(commands) {
    this.commands = commands;
    this.aliasLookup = new Map();

    for (const command of commands.values()) {
      this.aliasLookup.set(command.name, command.name);
      for (const alias of command.aliases || []) {
        this.aliasLookup.set(alias, command.name);
      }
    }
  }

  resolve(rawName) {
    if (!rawName) {
      return null;
    }

    const normalizedName = rawName.toLowerCase();
    const canonicalName = this.aliasLookup.get(normalizedName);

    return canonicalName ? this.commands.get(canonicalName) : null;
  }
}

module.exports = { AliasResolver };

