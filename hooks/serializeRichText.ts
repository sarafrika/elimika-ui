import { Node, Text } from "slate"

export function serialize(nodes: Node[]): string {
  return nodes
    .map((node) => {
      if (Text.isText(node)) {
        let text = node.text
        //@ts-ignore
        if (node.bold) text = `<strong>${text}</strong>`
        //@ts-ignore
        if (node.italic) text = `<em>${text}</em>`
        //@ts-ignore
        if (node.underline) text = `<u>${text}</u>`
        return text
      }

      //@ts-ignore
      switch (node.type) {
        case "h1":
          return `<h1>${serialize(node.children)}</h1>`
        case "h2":
          return `<h2>${serialize(node.children)}</h2>`
        case "h3":
          return `<h3>${serialize(node.children)}</h3>`
        case "blockquote":
          return `<blockquote>${serialize(node.children)}</blockquote>`
        case "paragraph":
        default:
          return `<p>${serialize(node.children)}</p>`
      }
    })
    .join("")
}

export function deserialize(html: string): Node[] {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html")
  const body = doc.body

  //@ts-ignore
  const deserializeElement = (el: Element): SlateElement => {
    const children = Array.from(el.childNodes).map(deserializeNode)

    switch (el.tagName.toLowerCase()) {
      case "h1":
        return { type: "h1", children }
      case "h2":
        return { type: "h2", children }
      case "h3":
        return { type: "h3", children }
      case "blockquote":
        return { type: "blockquote", children }
      case "p":
      default:
        return { type: "p", children }
    }
  }

  const deserializeNode = (node: globalThis.Node): Node => {
    if (node.nodeType === globalThis.Node.TEXT_NODE) {
      return { text: node.textContent || "" }
    }

    if (node.nodeType === globalThis.Node.ELEMENT_NODE) {
      const el = node as HTMLElement

      // Formatting tags
      if (el.tagName === "STRONG") {
        // @ts-ignore
        return { text: el.textContent || "", bold: true }
      }
      if (el.tagName === "EM") {
        // @ts-ignore

        return { text: el.textContent || "", italic: true }
      }
      if (el.tagName === "U") {
        // @ts-ignore

        return { text: el.textContent || "", underline: true }
      }

      return deserializeElement(el)
    }

    // fallback empty text node
    return { text: "" }
  }

  // <---- Here is the fix: use body.children instead of childNodes
  return Array.from(body.children).map(deserializeNode)
}
