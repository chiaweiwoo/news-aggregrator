import React, { useEffect, useState } from 'react';
import { Box, Container, Heading, SimpleGrid, Spinner, Input, Text } from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';
import HeadlineCard from './components/HeadlineCard';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function App() {
  const [headlines, setHeadlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(5);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('headlines')
      .select('*')
      .order('published_at', { ascending: false })
      .limit(count)
      .then(({ data }) => {
        setHeadlines(data || []);
        setLoading(false);
      });
  }, [count]);

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>YouTube News Aggregator</Heading>
      <Box mb={4}>
        <Text mb={2}>Number of headlines to show:</Text>
        <Input
          type="number"
          min={1}
          max={30}
          value={count}
          onChange={e => setCount(Number(e.target.value))}
          width="100px"
        />
      </Box>
      {loading ? (
        <Spinner size="xl" />
      ) : (
        <SimpleGrid columns={{ base: 1, md: 3, lg: 4 }} spacing={6}>
          {headlines.map((h) => (
            <HeadlineCard key={h.id} headline={h} />
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}
