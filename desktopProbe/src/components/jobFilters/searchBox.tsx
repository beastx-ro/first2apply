import { Cross2Icon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

import { Input } from '../ui/input';

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
        placeholder="Search..."
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />

      <MagnifyingGlassIcon className="absolute left-5 top-3.5 h-5 w-fit text-muted-foreground" />

      {inputValue && (
        <Cross2Icon
          className="absolute right-3.5 top-3.5 h-5 w-5 cursor-pointer text-muted-foreground"
          onClick={handleClearInput}
        />
      )}
    </div>
  );
}
