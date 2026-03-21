function parsePrefixedCommand(content, prefix) {
  if (!content || !content.startsWith(prefix)) {
    return null;
  }

  const sliced = content.slice(prefix.length).trim();
  if (!sliced) {
    return null;
  }

  const tokens = sliced.split(/\s+/);
  const [commandName, ...args] = tokens;

  return {
    commandName: commandName.toLowerCase(),
    args
  };
}

module.exports = { parsePrefixedCommand };
