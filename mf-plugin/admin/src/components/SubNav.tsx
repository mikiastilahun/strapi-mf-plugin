import { Box, Flex, Typography } from '@strapi/design-system';
import { NavLink } from 'react-router-dom';
import { PLUGIN_ID } from '../pluginId';

const navLinkStyle = (isActive: boolean): React.CSSProperties => ({
  textDecoration: 'none',
  padding: '8px 16px',
  borderRadius: '4px',
  background: isActive ? '#4945ff' : 'transparent',
  color: isActive ? '#ffffff' : '#32324d',
  fontWeight: isActive ? 600 : 400,
  transition: 'background 0.2s, color 0.2s',
});

export function SubNav() {
  return (
    <Box
      paddingLeft={8}
      paddingRight={8}
      paddingTop={4}
      paddingBottom={2}
      background="neutral100"
    >
      <Flex gap={2}>
        <NavLink
          to={`/plugins/${PLUGIN_ID}/layouts`}
          style={({ isActive }) => navLinkStyle(isActive)}
        >
          <Typography
            variant="omega"
            fontWeight="inherit"
            textColor="inherit"
            style={{ color: 'inherit', fontWeight: 'inherit' }}
          >
            Manage Layouts
          </Typography>
        </NavLink>
        <NavLink
          to={`/plugins/${PLUGIN_ID}/sources`}
          style={({ isActive }) => navLinkStyle(isActive)}
        >
          <Typography
            variant="omega"
            fontWeight="inherit"
            textColor="inherit"
            style={{ color: 'inherit', fontWeight: 'inherit' }}
          >
            Manage Sources
          </Typography>
        </NavLink>
      </Flex>
    </Box>
  );
}
