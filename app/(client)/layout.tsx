import type { PropsWithChildren } from 'react';

const ClientLayout = ({ children }: PropsWithChildren) => {
  return <div className="mx-auto">{children}</div>;
};
export default ClientLayout;
