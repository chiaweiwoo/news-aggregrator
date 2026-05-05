import React from 'react';
import { Box, Flex, Image, Text, HStack, Badge, Link, Tooltip } from '@chakra-ui/react';

export default function HeadlineCard({ headline }: { headline: any }) {
  const youtubeUrl = `https://www.youtube.com/watch?v=${headline.id}`;
  const datetime = new Date(headline.published_at).toLocaleString('en-MY', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <HStack
      align="stretch"
      spacing={3}
      p={3}
      bg="white"
      borderRadius="lg"
      boxShadow="xs"
      h="112px"
      _hover={{ boxShadow: 'md', transform: 'translateY(-1px)' }}
      transition="all 0.15s ease"
    >
      <Link href={youtubeUrl} isExternal flexShrink={0} alignSelf="flex-start"
        _hover={{ opacity: 0.88 }}>
        <Image
          src={headline.thumbnail_url}
          alt={headline.title_zh}
          borderRadius="md"
          w="88px"
          h="50px"
          objectFit="cover"
        />
      </Link>

      <Flex direction="column" flex={1} overflow="hidden" justify="space-between">
        <Box overflow="hidden">
          <Tooltip label={headline.title_zh} placement="top" hasArrow openDelay={500}
            bg="gray.800" color="white" fontSize="xs" borderRadius="md" maxW="300px">
            <Link href={youtubeUrl} isExternal _hover={{ textDecoration: 'none' }}>
              <Text fontSize="xs" fontWeight="bold" lineHeight="1.4" color="gray.800"
                _hover={{ color: 'red.500' }} transition="color 0.1s" noOfLines={2}>
                {headline.title_zh}
              </Text>
            </Link>
          </Tooltip>

          <Tooltip label={headline.title_en} placement="bottom" hasArrow openDelay={500}
            bg="gray.800" color="white" fontSize="xs" borderRadius="md" maxW="300px">
            <Text fontSize="xs" color="gray.400" lineHeight="1.4" noOfLines={2}
              cursor="default" mt={1}>
              {headline.title_en}
            </Text>
          </Tooltip>
        </Box>

        <HStack spacing={2} flexShrink={0}>
          <Badge colorScheme="red" variant="subtle" fontSize="2xs" borderRadius="full" px={1.5}>
            {headline.channel}
          </Badge>
          <Text fontSize="2xs" color="gray.300" ml="auto">{datetime}</Text>
        </HStack>
      </Flex>
    </HStack>
  );
}
