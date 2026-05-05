import React, { useEffect, useState } from 'react';
import {
  Box, Container, Heading, SimpleGrid, Spinner,
  Text, Button, Center, VStack
} from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';
import HeadlineCard from './components/HeadlineCard';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const PAGE_SIZE = 20;

export default function App() {
  const [headlines, setHeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchHeadlines(0, true);
  }, []);

  async function fetchHeadlines(offset: number, initial = false) {
    initial ? setLoading(true) : setLoadingMore(true);

    const { data } = await supabase
      .from('headlines')
      .select('*')
      .order('published_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const rows = data || [];
    setHeadlines(prev => initial ? rows : [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    initial ? setLoading(false) : setLoadingMore(false);
  }

  function loadMore() {
    fetchHeadlines(headlines.length);
  }

  return (
    <Box minH="100vh" bg="gray.50">
      <Box bg="white" borderBottomWidth="1px" borderColor="gray.200" py={5} mb={8}>
        <Container maxW="container.xl">
          <Heading size="lg" color="gray.800">🗞 Malaysian News</Heading>
          <Text color="gray.500" fontSize="sm" mt={1}>
            Latest from Astro 本地圈 — Chinese headlines with English translations
          </Text>

        </Container>
      </Box>

      <Container maxW="container.xl" pb={12}>
        {loading ? (
          <Center py={20}>
            <Spinner size="xl" color="red.500" />
          </Center>
        ) : headlines.length === 0 ? (
          <Center py={20}>
            <VStack spacing={3}>
              <Text fontSize="xl">😶 No headlines yet</Text>
              <Text color="gray.500" fontSize="sm">Run the job to fetch the latest news</Text>
            </VStack>
          </Center>
        ) : (
          <>
            <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={5}>
              {headlines.map(h => (
                <HeadlineCard key={h.id} headline={h} />
              ))}
            </SimpleGrid>

            {hasMore && (
              <Center mt={10}>
                <Button
                  onClick={loadMore}
                  isLoading={loadingMore}
                  loadingText="Loading..."
                  colorScheme="red"
                  variant="outline"
                  size="md"
                >
                  Load more
                </Button>
              </Center>
            )}

            {!hasMore && headlines.length > 0 && (
              <Center mt={10}>
                <Text color="gray.400" fontSize="sm">You've reached the end</Text>
              </Center>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
