function serializeMap(map: Map<string, Map<string, string>>): string {
  // Map<string, Map<string, string>>을 직렬화
  const objectRepresentation = Object.fromEntries(
    Array.from(map.entries()).map(([key, innerMap]) => [
      key,
      Object.fromEntries(innerMap),
    ]),
  );

  return JSON.stringify(objectRepresentation);
}

function deserializeMap(
  serializedString: string,
): Map<string, Map<string, string>> {
  // JSON 문자열을 객체로 파싱
  const parsedObject = JSON.parse(serializedString);

  // 객체를 Map<string, Map<string, string>> 형태로 변환
  return new Map(
    Object.entries(parsedObject).map(([key, innerObject]) => [
      key,
      new Map(Object.entries(innerObject as Record<string, string>)),
    ]),
  );
}

export { serializeMap, deserializeMap };
