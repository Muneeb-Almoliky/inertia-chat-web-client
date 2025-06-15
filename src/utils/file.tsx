import { FileText, Image, File } from "lucide-react"

export const getFileIcon = (file: File) => {
  if (file.type.startsWith('image/')) {
    return <Image className="h-4 w-4 text-blue-500" />;
  }
  if (file.type === 'application/pdf') {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  return <File className="h-4 w-4 text-gray-500" />;
}

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

export const getFileType = (file: File): string => {
  if (file.type.startsWith('image/')) {
    return 'Image';
  }
  if (file.type === 'application/pdf') {
    return 'PDF';
  }
  if (file.type.includes('word')) {
    return 'Word';
  }
  if (file.type.includes('excel') || file.type.includes('spreadsheet')) {
    return 'Excel';
  }
  if (file.type.includes('powerpoint') || file.type.includes('presentation')) {
    return 'PowerPoint';
  }
  if (file.type.includes('text/plain')) {
    return 'Text';
  }
  return 'File';
}