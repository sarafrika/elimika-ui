const FILE_ACCEPT_TYPES: Record<string, string> = {
  DOCUMENT: '.pdf,.doc,.docx,.txt,.rtf',
  IMAGE: 'image/*',
  AUDIO: 'audio/*',
  VIDEO: 'video/*',
};

export function getSubmissionInputRules(value: unknown) {
  const submissionTypes = (Array.isArray(value) ? value : value ? [value] : ['TEXT'])
    .map(type => String(type).trim().toUpperCase());
  const acceptedFiles = submissionTypes.flatMap(type =>
    FILE_ACCEPT_TYPES[type] ? FILE_ACCEPT_TYPES[type].split(',') : []
  );

  return {
    submissionTypes,
    canSubmitText: submissionTypes.includes('TEXT') || submissionTypes.includes('URL'),
    canUploadFiles: acceptedFiles.length > 0,
    fileAccept: acceptedFiles.join(','),
    acceptsFile: (file: Pick<File, 'name' | 'type'>) => acceptedFiles.some(accept =>
      accept.startsWith('.')
        ? file.name.toLowerCase().endsWith(accept)
        : file.type.toLowerCase().startsWith(accept.slice(0, -1))
    ),
  };
}
