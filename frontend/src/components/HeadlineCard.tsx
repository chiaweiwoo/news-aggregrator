import React from 'react';
import { Box, Image, Text, VStack } from '@chakra-ui/react';

export default function HeadlineCard({ headline }: { headline: any }) {
  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" p={4} boxShadow="md">
      <Image src={headline.thumbnail_url} alt={headline.title_zh} mb={3} borderRadius="md" />
      <VStack align="start" spacing={1}>
        <Text fontWeight="bold" fontSize="md">{headline.title_zh}</Text>
        <Text color="gray.500" fontSize="sm">{headline.title_en}</Text>
        <Text color="gray.400" fontSize="xs" mt={2}>{new Date(headline.published_at).toLocaleString()}</Text>
      </VStack>
    </Box>
  );
}
