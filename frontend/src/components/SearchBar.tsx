import React, { useEffect, useRef } from 'react';
import { Box, Flex, Input, Spinner, Text, VStack } from '@chakra-ui/react';
import HeadlineCard from './HeadlineCard';

interface Props {
  query:     string;
  onChange:  (q: string) => void;
  onClose:   () => void;
  results:   any[];
  isLoading: boolean;
}

function IconSearch() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <circle cx="6.5" cy="6.5" r="4.5" />
      <line x1="10" y1="10" x2="14" y2="14" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <line x1="1" y1="1" x2="13" y2="13" />
      <line x1="13" y1="1" x2="1" y2="13" />
    </svg>
  );
}

export default function SearchBar({ query, onChange, onClose, results, isLoading }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus when bar opens
  useEffect(() => { inputRef.current?.focus(); }, []);

  return (
    <>
      {/* Input row — replaces the title row */}
      <Flex align="center" gap={2} pt={3} pb={2}>
        <Box color="gray.500" flexShrink={0}><IconSearch /></Box>
        <Input
          ref={inputRef}
          value={query}
          onChange={e => onChange(e.target.value)}
          placeholder="Search headlines…"
          variant="unstyled"
          fontSize="16px"
          color="white"
          _placeholder={{ color: 'gray.600' }}
          flex={1}
        />
        {isLoading && <Spinner size="xs" color="gray.500" flexShrink={0} />}
        <Box
          as="button"
          onClick={onClose}
          color="gray.500"
          _hover={{ color: 'white' }}
          transition="color 0.15s"
          flexShrink={0}
          aria-label="Close search"
        >
          <IconClose />
        </Box>
      </Flex>

      {/* Results — rendered below the sticky header in the feed area */}
      {query.trim().length > 0 && (
        <Box
          position="fixed"
          top="var(--header-h, 80px)"
          left={0} right={0}
          bottom={0}
          bg="brand.paper"
          overflowY="auto"
          zIndex={40}
        >
          <Box maxW="600px" mx="auto" px={3} pt={4} pb={16}>
            {isLoading ? null : results.length === 0 ? (
              <Flex justify="center" pt={16}>
                <VStack spacing={2}>
                  <Text fontSize="2xl">🔍</Text>
                  <Text fontSize="sm" color="brand.muted">No results for "{query}"</Text>
                </VStack>
              </Flex>
            ) : (
              <VStack spacing={2} align="stretch">
                <Text fontSize="2xs" color="brand.muted" fontWeight="700"
                  textTransform="uppercase" letterSpacing="wider" mb={1}>
                  {results.length} result{results.length !== 1 ? 's' : ''}
                </Text>
                {results.map(h => <HeadlineCard key={h.id} headline={h} />)}
              </VStack>
            )}
          </Box>
        </Box>
      )}
    </>
  );
}
