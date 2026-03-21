const fs = require("fs");
const path = require("path");

function loadEvents(client, eventsDir) {
  const files = fs.readdirSync(eventsDir).filter((file) => file.endsWith(".js"));

  for (const file of files) {
    const event = require(path.join(eventsDir, file));
    if (!event || !event.name || typeof event.execute !== "function") {
      throw new Error(`Invalid event module at ${file}`);
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(client, ...args));
      continue;
    }

    client.on(event.name, (...args) => event.execute(client, ...args));
  }
}

module.exports = { loadEvents };

