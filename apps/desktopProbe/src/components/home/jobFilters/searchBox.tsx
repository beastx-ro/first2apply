import { Input } from '@/components/ui/input';
import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

/**
 * Search box component.
 */
export function SearchBox({
  inputValue,
  setInputValue,
}: {
  inputValue: string;
  setInputValue: (value: string) => void;
}) {
  const handleClearInput = () => {
    setInputValue('');
  };

  return (
    <div className="relative h-12 flex-grow">
      <Input
        className="h-full w-full overflow-x-scroll rounded-md px-11 focus-visible:outline-none focus-visible:ring-0"
        placeholder="Search by title or company name ..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      <MagnifyingGlassIcon className="text-muted-foreground absolute left-5 top-3.5 h-5 w-fit" />

      {inputValue && (
        <Cross2Icon
          className="text-muted-foreground absolute right-3.5 top-3.5 h-5 w-5 cursor-pointer"
          onClick={handleClearInput}
        />
      )}
    </div>
  );
}
