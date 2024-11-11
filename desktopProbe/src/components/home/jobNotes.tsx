import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { useError } from '@/hooks/error';
import { addFileToNote, createNote, deleteNote, listNotes, updateNote } from '@/lib/electronMainSdk';
import { PlusIcon } from '@radix-ui/react-icons';
import { Pencil2Icon, TrashIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import TextareaAutosize from 'react-textarea-autosize';
import remarkGfm from 'remark-gfm';

import { Note } from '../../../../supabase/functions/_shared/types';
import { AlertDialogFooter, AlertDialogHeader } from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader } from '../ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

/**
 * Job notes component.
 */
export function JobNotes({ jobId }: { jobId: number }) {
  const { handleError } = useError();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [newNote, setNewNote] = useState<Note | undefined>();
  const [noteToDelete, setNoteToDelete] = useState<Note | undefined>();

  // Fetch notes for the job
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const notes = await listNotes(jobId);
        setNotes(notes);
        setIsLoading(false);
      } catch (error) {
        handleError({ error });
      }
    };

    fetchNotes();
  }, [jobId]);

  // Create a new note
  const handleCreateNote = async (job_id: number, text: string, files: string[]) => {
    try {
      const newNote = await createNote({ job_id, text, files });
      setNewNote(undefined);
      setNotes((prevNotes) => [newNote, ...prevNotes]);
    } catch (error) {
      handleError({ error, title: 'Failed to create note' });
    }
  };

  // Update an existing note
  const handleUpdateNote = async (noteId: number, text: string) => {
    if (text.trim() === '') {
      toast({
        title: 'Error',
        description: 'Note text cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    try {
      const updatedNote = await updateNote({
        noteId,
        text,
      });
      setEditingNoteId(null);
      setNotes(notes.map((note) => (note.id === noteId ? { ...note, ...updatedNote } : note)));
    } catch (error) {
      handleError({ error, title: 'Failed to update note' });
    }
  };

  // Delete an existing note
  const handleDeleteNote = async (noteId: number) => {
    try {
      await deleteNote(noteId);
      setNotes(notes.filter((note) => note.id !== noteId));
    } catch (error) {
      handleError({ error, title: 'Failed to delete note' });
    }
  };

  // Add a file to a note
  const handleAddFileToNote = async (noteId: number, file: string) => {
    try {
      const updatedNote = await addFileToNote({
        noteId,
        file,
      });
      setNotes(notes.map((note) => (note.id === noteId ? { ...note, ...updatedNote } : note)));
      toast({
        title: 'Success',
        description: 'File has been successfully added to the note.',
        variant: 'success',
      });
    } catch (error) {
      handleError({ error });
    }
  };

  // Add new note button
  const handleNewNote = async () => {
    try {
      setNewNote({
        id: -1,
        created_at: new Date(),
        user_id: '',
        job_id: jobId,
        text: '',
        files: [],
      });
    } catch (error) {
      console;
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="ml-[25px] pb-10">
      <div className="flex items-center">
        <h3 className="text-2xl">Your notes</h3>

        <Button size="xs" className="ml-2 rounded-full px-1" onClick={handleNewNote} disabled={newNote !== undefined}>
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 space-y-3 lg:mt-5">
        {newNote && (
          <EditJobNote
            note={newNote}
            isNew={true}
            onCreate={handleCreateNote}
            onUpdate={handleUpdateNote}
            onAddFile={handleAddFileToNote}
            onEndEditing={() => setNewNote(undefined)}
          />
        )}

        {!newNote && notes.length === 0 ? (
          <p className="py-10 text-center">No notes available</p>
        ) : (
          notes.map((note) =>
            editingNoteId === note.id ? (
              <EditJobNote
                key={note.id}
                note={note}
                isNew={false}
                onCreate={handleCreateNote}
                onUpdate={handleUpdateNote}
                onAddFile={handleAddFileToNote}
                onEndEditing={() => setEditingNoteId(null)}
              />
            ) : (
              <JobNote
                key={note.id}
                note={note}
                onDelete={(noteId) => setNoteToDelete(notes.find((note) => note.id === noteId))}
                onAddFile={handleAddFileToNote}
                onStartEditing={() => setEditingNoteId(note.id)}
              />
            ),
          )
        )}
      </div>

      {noteToDelete && (
        <DeleteNoteDialog
          isOpen={!!noteToDelete}
          note={noteToDelete}
          onClose={() => setNoteToDelete(undefined)}
          onDelete={(note) => {
            handleDeleteNote(note.id);
          }}
        />
      )}
    </div>
  );
}

/**
 * job note component.
 */
function JobNote({
  note,
  onDelete,
  onAddFile,
  onStartEditing,
}: {
  note: Note;
  onDelete: (noteId: number) => void;
  onAddFile: (noteId: number, file: string) => Promise<void>;
  onStartEditing: (noteId: number) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex w-full flex-row items-center justify-between">
        <CardDescription className="text-xs">{new Date(note.created_at).toLocaleDateString()}</CardDescription>
        <div className="flex gap-2">
          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="outline" size="sm" className="w-8 p-0" onClick={() => onStartEditing(note.id)}>
                  <Pencil2Icon className="h-4 w-auto" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm">
                Edit
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger>
                <Button variant="outline" size="sm" className="w-8 p-0" onClick={() => onDelete(note.id)}>
                  <TrashIcon className="h-auto w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm">
                Delete
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* <TooltipProvider delayDuration={500}>
            <Tooltip>
              <TooltipTrigger className="relative cursor-pointer">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-8 p-0 cursor-pointer"
                >
                  <UploadIcon className="w-auto h-4 cursor-pointer" />
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  className="absolute top-0 right-0 w-7 h-7 opacity-0 cursor-pointer"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-sm">
                Attach file
              </TooltipContent>
            </Tooltip>
          </TooltipProvider> */}
        </div>
      </CardHeader>
      <CardContent className="pb-5">
        <Markdown remarkPlugins={[remarkGfm]} className="job-description-md px-6 py-2">
          {note.text}
        </Markdown>
      </CardContent>
      <CardFooter>
        {/* {note.files.length > 0 && (
          <div className="mt-4 flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Uploads:</span>
            {note.files.map((file) => (
              <Badge key={note.id} className="cursor-pointer">
                {file}
              </Badge>
            ))}
          </div>
        )} */}
      </CardFooter>
    </Card>
  );
}

function EditJobNote({
  note,
  isNew,
  onCreate,
  onUpdate,
  onAddFile,
  onEndEditing,
}: {
  note: Note;
  isNew: boolean;
  onCreate: (job_id: number, text: string, files: string[]) => Promise<void>;
  onUpdate: (noteId: number, text: string) => Promise<void>;
  onAddFile: (noteId: number, file: string) => Promise<void>;
  onEndEditing: () => void;
}) {
  const { toast } = useToast();

  const [text, setText] = useState(note.text);

  return (
    <Card>
      <CardHeader className="flex w-full flex-row items-center justify-between">
        <CardDescription className="text-xs">{new Date(note.created_at).toLocaleDateString()}</CardDescription>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              isNew ? onCreate(note.job_id, text, []) : onUpdate(note.id, text);
            }}
            disabled={text.trim() === ''}
          >
            Save
          </Button>

          {isNew ? (
            <Button variant="outline" size="sm" onClick={onEndEditing}>
              Discard
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={onEndEditing}>
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <TextareaAutosize
          value={text}
          autoFocus={isNew}
          onChange={(e) => setText(e.target.value)}
          className={`mb-2.5 w-full resize-none rounded-md px-6 py-2 text-base ring-ring focus:outline-none focus:ring-2 ${
            isNew && 'ring-2'
          }`}
        />
        <p className="text-sm italic">Hint: Markdown syntax is supported</p>
      </CardContent>
      <CardFooter>
        {/* {note.files.length > 0 && (
          <div className="mt-4 flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Uploads:</span>
            {note.files.map((file) => (
              <Badge key={note.id} className="cursor-pointer">
                {file}
              </Badge>
            ))}
          </div>
        )} */}
      </CardFooter>
    </Card>
  );
}

/**
 * Delete note confirmation dialog component.
 */
export function DeleteNoteDialog({
  isOpen,
  onClose,
  onDelete,
  note,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (note: Note) => void;
  note: Note;
}) {
  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure you want to delete this note?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the note.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => onDelete(note)}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
