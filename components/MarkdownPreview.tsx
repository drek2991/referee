function renderInlineMarkdown(text: string) {
  const segments = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);

  return segments.map((segment, index) => {
    if (segment.startsWith("`") && segment.endsWith("`") && segment.length > 1) {
      return (
        <code
          key={`${segment}-${index}`}
          className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[0.9em] text-cyan-100"
        >
          {segment.slice(1, -1)}
        </code>
      );
    }

    if (
      segment.startsWith("**") &&
      segment.endsWith("**") &&
      segment.length > 3
    ) {
      return (
        <strong key={`${segment}-${index}`} className="font-semibold text-white">
          {segment.slice(2, -2)}
        </strong>
      );
    }

    return segment;
  });
}

export default function MarkdownPreview({ content }: { content: string }) {
  const trimmedContent = content.trim();

  if (!trimmedContent) {
    return (
      <p className="text-sm leading-7 text-slate-500">
        The streamed explanation will appear here.
      </p>
    );
  }

  const lines = trimmedContent.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let bulletItems: string[] = [];

  const flushBulletItems = () => {
    if (bulletItems.length === 0) {
      return;
    }

    elements.push(
      <ul
        key={`list-${elements.length}`}
        className="list-disc space-y-2 pl-5 text-sm leading-7 text-slate-300"
      >
        {bulletItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  lines.forEach((line) => {
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);

    if (bulletMatch) {
      bulletItems.push(bulletMatch[1]);
      return;
    }

    flushBulletItems();

    if (headingMatch) {
      elements.push(
        <h3
          key={`heading-${elements.length}`}
          className="text-base font-semibold text-white"
        >
          {renderInlineMarkdown(headingMatch[2])}
        </h3>
      );
      return;
    }

    if (line.trim().length === 0) {
      elements.push(<div key={`space-${elements.length}`} className="h-2" />);
      return;
    }

    elements.push(
      <p key={`paragraph-${elements.length}`} className="text-sm leading-7">
        {renderInlineMarkdown(line)}
      </p>
    );
  });

  flushBulletItems();

  return <div className="space-y-3 text-slate-300">{elements}</div>;
}
