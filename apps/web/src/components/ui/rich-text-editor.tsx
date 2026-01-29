"use client";

import * as React from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Node, Extension, type AnyExtension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Image as ImageIcon, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUploadAttachment, validateFile, getFileType, type UploadResult } from "@/hooks/useUploadAttachment";
import { toast } from "@/hooks/use-toast";
import {
  ImageNodeView,
  VideoNodeView,
  FileAttachmentNodeView,
  UploadPlaceholderNodeView,
  DragDropZone,
} from "./file-upload-node";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  enableFileUpload?: boolean;
}

/**
 * Custom Video Node for Tiptap
 */
const VideoNode = Node.create({
  name: "video",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      title: { default: null },
      controls: { default: true },
    };
  },

  parseHTML() {
    return [{ tag: "video" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["video", { ...HTMLAttributes, controls: true, class: "tiptap-video" }];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoNodeView);
  },
});

/**
 * Custom File Attachment Node for Tiptap
 */
const FileAttachmentNode = Node.create({
  name: "fileAttachment",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      filename: { default: null },
      contentType: { default: null },
      size: { default: 0 },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="file-attachment"]',
        getAttrs: (node) => {
          if (typeof node === "string") return false;
          return {
            src: node.getAttribute("data-src"),
            filename: node.getAttribute("data-filename"),
            contentType: node.getAttribute("data-content-type"),
            size: parseInt(node.getAttribute("data-size") || "0", 10),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        "data-type": "file-attachment",
        "data-src": HTMLAttributes.src,
        "data-filename": HTMLAttributes.filename,
        "data-content-type": HTMLAttributes.contentType,
        "data-size": HTMLAttributes.size,
        class: "tiptap-file-attachment",
      },
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FileAttachmentNodeView);
  },
});

/**
 * Custom Image Extension with React NodeView
 */
const CustomImage = Image.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

/**
 * Upload Placeholder Node
 */
const UploadPlaceholderNode = Node.create({
  name: "uploadPlaceholder",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      filename: { default: null },
      uploadId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="upload-placeholder"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        "data-type": "upload-placeholder",
        class: "tiptap-upload-placeholder",
      },
      HTMLAttributes.filename || "Uploading...",
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(UploadPlaceholderNodeView);
  },
});

/**
 * File Upload Extension
 * Handles drag & drop and paste events for file uploads
 */
function createFileUploadExtension(onUpload: (file: File) => Promise<UploadResult>) {
  return Extension.create({
    name: "fileUpload",

    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("fileUpload"),

          props: {
            handleDrop: (view, event, _slice, moved) => {
              if (!event.dataTransfer || moved) {
                return false;
              }

              const files = Array.from(event.dataTransfer.files);
              if (files.length === 0) {
                return false;
              }

              event.preventDefault();

              const coordinates = view.posAtCoords({
                left: event.clientX,
                top: event.clientY,
              });

              if (!coordinates) {
                return false;
              }

              files.forEach(async (file) => {
                const validation = validateFile(file);
                if (!validation.valid) {
                  toast({
                    variant: "destructive",
                    title: "Invalid file",
                    description: validation.error,
                  });
                  return;
                }

                try {
                  const result = await onUpload(file);
                  const fileType = getFileType(result.contentType);

                  let node;
                  const { schema } = view.state;
                  
                  if (fileType === "image" && schema.nodes.image) {
                    node = schema.nodes.image.create({
                      src: result.url,
                      alt: result.filename,
                      title: result.filename,
                    });
                  } else if (fileType === "video" && schema.nodes.video) {
                    node = schema.nodes.video.create({
                      src: result.url,
                      title: result.filename,
                    });
                  } else if (schema.nodes.fileAttachment) {
                    node = schema.nodes.fileAttachment.create({
                      src: result.url,
                      filename: result.filename,
                      contentType: result.contentType,
                      size: result.size,
                    });
                  }

                  if (node) {
                    const transaction = view.state.tr.insert(coordinates.pos, node);
                    view.dispatch(transaction);
                  }
                } catch (error) {
                  console.error("Upload failed:", error);
                }
              });

              return true;
            },

            handlePaste: (view, event) => {
              const items = event.clipboardData?.items;
              if (!items) {
                return false;
              }

              const files: File[] = [];
              for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item?.kind === "file") {
                  const file = item.getAsFile();
                  if (file) {
                    files.push(file);
                  }
                }
              }

              if (files.length === 0) {
                return false;
              }

              event.preventDefault();

              files.forEach(async (file) => {
                const validation = validateFile(file);
                if (!validation.valid) {
                  toast({
                    variant: "destructive",
                    title: "Invalid file",
                    description: validation.error,
                  });
                  return;
                }

                try {
                  const result = await onUpload(file);
                  const fileType = getFileType(result.contentType);

                  let node;
                  const { schema } = view.state;

                  if (fileType === "image" && schema.nodes.image) {
                    node = schema.nodes.image.create({
                      src: result.url,
                      alt: result.filename,
                      title: result.filename,
                    });
                  } else if (fileType === "video" && schema.nodes.video) {
                    node = schema.nodes.video.create({
                      src: result.url,
                      title: result.filename,
                    });
                  } else if (schema.nodes.fileAttachment) {
                    node = schema.nodes.fileAttachment.create({
                      src: result.url,
                      filename: result.filename,
                      contentType: result.contentType,
                      size: result.size,
                    });
                  }

                  if (node) {
                    const transaction = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(transaction);
                  }
                } catch (error) {
                  console.error("Upload failed:", error);
                }
              });

              return true;
            },
          },
        }),
      ];
    },
  });
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Add a description...",
  className,
  minHeight = "120px",
  enableFileUpload = true,
}: RichTextEditorProps) {
  const uploadAttachment = useUploadAttachment();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleUpload = React.useCallback(
    async (file: File): Promise<UploadResult> => {
      setIsUploading(true);
      try {
        const result = await uploadAttachment.mutateAsync(file);
        return result;
      } finally {
        setIsUploading(false);
      }
    },
    [uploadAttachment]
  );

  const extensions = React.useMemo((): AnyExtension[] => {
    const baseExtensions: AnyExtension[] = [
      StarterKit.configure({
        heading: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:absolute before:opacity-50 before:pointer-events-none",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-2",
        },
      }),
    ];

    if (enableFileUpload) {
      baseExtensions.push(
        CustomImage.configure({
          HTMLAttributes: {
            class: "tiptap-image max-w-full h-auto rounded-lg",
          },
        }),
        VideoNode,
        FileAttachmentNode,
        UploadPlaceholderNode,
        createFileUploadExtension(handleUpload)
      );
    }

    return baseExtensions;
  }, [placeholder, enableFileUpload, handleUpload]);

  const editor = useEditor({
    extensions,
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none px-3 py-2",
          "prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0",
          "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
          // Image styles
          "[&_.tiptap-image]:max-w-full [&_.tiptap-image]:h-auto [&_.tiptap-image]:rounded-lg",
          // Video styles
          "[&_.tiptap-video]:max-w-full [&_.tiptap-video]:rounded-lg",
          "[&_.tiptap-video-wrapper]:my-2",
          // File attachment styles
          "[&_.tiptap-file-attachment-wrapper]:my-2"
        ),
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html === "<p></p>") {
        onChange("");
      } else {
        onChange(html);
      }
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      const currentHtml = editor.getHTML();
      const normalizedValue = value || "<p></p>";
      if (normalizedValue !== currentHtml && value !== "") {
        editor.commands.setContent(value);
      } else if (value === "" && currentHtml !== "<p></p>") {
        editor.commands.setContent("");
      }
    }
  }, [editor, value]);

  const handleFileInputChange = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0 || !editor) return;

      for (const file of files) {
        const validation = validateFile(file);
        if (!validation.valid) {
          toast({
            variant: "destructive",
            title: "Invalid file",
            description: validation.error,
          });
          continue;
        }

        try {
          const result = await handleUpload(file);
          const fileType = getFileType(result.contentType);

          if (fileType === "image") {
            editor
              .chain()
              .focus()
              .setImage({
                src: result.url,
                alt: result.filename,
                title: result.filename,
              })
              .run();
          } else if (fileType === "video") {
            editor
              .chain()
              .focus()
              .insertContent({
                type: "video",
                attrs: {
                  src: result.url,
                  title: result.filename,
                },
              })
              .run();
          } else {
            editor
              .chain()
              .focus()
              .insertContent({
                type: "fileAttachment",
                attrs: {
                  src: result.url,
                  filename: result.filename,
                  contentType: result.contentType,
                  size: result.size,
                },
              })
              .run();
          }
        } catch (error) {
          // Error is already handled by the mutation
          console.error("Upload failed:", error);
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [editor, handleUpload]
  );

  const handleImageButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.click();
    }
  };

  const handleAttachmentButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "*/*";
      fileInputRef.current.click();
    }
  };

  if (!editor) {
    return (
      <div
        className={cn("rounded-md border border-input bg-background", className)}
        style={{ minHeight }}
      />
    );
  }

  return (
    <DragDropZone className={cn("relative", className)}>
      <div
        className={cn(
          "rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-primary/50",
          "transition-all"
        )}
      >
        {/* Editor Content */}
        <EditorContent editor={editor} />

        {/* Upload Toolbar */}
        {enableFileUpload && (
          <div className="flex items-center gap-1 px-2 py-1.5 border-t border-input/50">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileInputChange}
              multiple
            />

            <button
              type="button"
              onClick={handleImageButtonClick}
              disabled={isUploading}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Insert image"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <ImageIcon className="h-3.5 w-3.5" />
              )}
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={handleAttachmentButtonClick}
              disabled={isUploading}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded text-xs",
                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                "transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              )}
              title="Attach file"
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Paperclip className="h-3.5 w-3.5" />
              )}
              <span>Attach</span>
            </button>

            {isUploading && (
              <span className="text-xs text-muted-foreground ml-auto">Uploading...</span>
            )}
          </div>
        )}
      </div>
    </DragDropZone>
  );
}
