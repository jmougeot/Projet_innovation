import { FC, ReactElement } from 'react';

interface TitleProps {
    children: React.ReactNode;
}

const Title: FC<TitleProps> = ({ children }): ReactElement => (
    <span className="text-xl font-bold">{children}</span>
);

const Content: FC<TitleProps> = ({ children }): ReactElement => (
    <span className="text-base">{children}</span>
);

const ModifierPlan: FC = (): ReactElement => {
    return (
        <>
            <Title>Modifier le Plan</Title>
            <Content>Contenu de la page de modification du plan</Content>
        </>
    );
};

export default ModifierPlan;