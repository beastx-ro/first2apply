import { MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function SearchBar({
  onJobTextSearch,
}: {
  onJobTextSearch: (text: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    // If the search is empty and we haven't searched, don't do anything
    if (!search && !hasSearched) return;

    onJobTextSearch(search);
    // If the search is empty again, we want to avoid the user keep using the search until it has a value
    if (!search) {
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
  };

  return (
    <div className="flex w-full justify-end">
      <div className="w=300px flex items-center">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search..."
        />
        <Button onClick={handleSearch}>
          <MagnifyingGlassIcon />
        </Button>
      </div>
    </div>
  );
}
