import React from 'react';
import { Box, Image, Text, VStack, Badge, LinkBox, LinkOverlay } from '@chakra-ui/react';

export default function HeadlineCard({ headline }: { headline: any }) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${headline.id}`;
  const date = new Date(headline.published_at).toLocaleDateString('en-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <LinkBox
      as="article"
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="sm"
      _hover={{ boxShadow: 'md', transform: 'translateY(-2px)' }}
      transition="all 0.15s ease"
      bg="white"
    >
      <Image
        src={headline.thumbnail_url}
        alt={headline.title_zh}
        w="100%"
        objectFit="cover"
        aspectRatio="16/9"
      />
      <VStack align="start" spacing={2} p={4}>
        <Badge colorScheme="red" fontSize="xs">{headline.channel}</Badge>
        <LinkOverlay href={youtubeUrl} isExternal>
          <Text fontWeight="bold" fontSize="sm" lineHeight="1.4" noOfLines={3}>
            {headline.title_zh}
          </Text>
        </LinkOverlay>
        <Text color="gray.500" fontSize="xs" lineHeight="1.4" noOfLines={3}>
          {headline.title_en}
        </Text>
        <Text color="gray.400" fontSize="xs" mt={1}>{date}</Text>
      </VStack>
    </LinkBox>
  );
}
